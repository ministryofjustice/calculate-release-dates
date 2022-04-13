import { RequestHandler } from 'express'
import PrisonerService from '../services/prisonerService'
import SentenceAndOffenceViewModel from '../models/SentenceAndOffenceViewModel'
import ViewReleaseDatesService from '../services/viewReleaseDatesService'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import { ErrorMessages, ErrorMessageType } from '../types/ErrorMessages'
import { FullPageError } from '../types/FullPageError'
import CalculationSummaryViewModel from '../models/CalculationSummaryViewModel'
import SentenceRowViewModel from '../models/SentenceRowViewModel'

export default class ViewRoutes {
  constructor(
    private readonly viewReleaseDatesService: ViewReleaseDatesService,
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService
  ) {}

  public startViewJourney: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    try {
      const latestCalculation = await this.viewReleaseDatesService.getLatestCalculation(
        nomsId,
        prisonerDetail.bookingId,
        token
      )
      res.redirect(`/view/${nomsId}/sentences-and-offences/${latestCalculation.calculationRequestId}`)
    } catch (error) {
      if (error.status === 404) {
        throw FullPageError.noCalculationSubmitted(nomsId, prisonerDetail)
      }
    }
  }

  public sentencesAndOffences: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const calculationRequestId = Number(req.params.calculationRequestId)
    try {
      const prisonerDetail = await this.viewReleaseDatesService.getPrisonerDetail(
        calculationRequestId,
        caseloads,
        token
      )
      const sentencesAndOffences = await this.viewReleaseDatesService.getSentencesAndOffences(
        calculationRequestId,
        token
      )
      const adjustmentDetails = await this.viewReleaseDatesService.getBookingAndSentenceAdjustments(
        calculationRequestId,
        token
      )
      const returnToCustody = sentencesAndOffences.filter(s => SentenceRowViewModel.isSentenceFixedTermRecall(s)).length
        ? await this.viewReleaseDatesService.getReturnToCustodyDate(calculationRequestId, token)
        : null

      res.render('pages/view/sentencesAndOffences', {
        ...new SentenceAndOffenceViewModel(prisonerDetail, sentencesAndOffences, adjustmentDetails, returnToCustody),
        calculationRequestId,
        nomsId,
      })
    } catch (error) {
      if (error.status === 404 && error.data?.errorCode === 'PRISON_API_DATA_MISSING') {
        res.redirect(`/view/${nomsId}/calculation-summary/${calculationRequestId}`)
      } else {
        throw error
      }
    }
  }

  private async calculateReleaseDatesViewModel(
    calculationRequestId: number,
    nomsId: string,
    username: string,
    token: string,
    caseloads: string[]
  ): Promise<CalculationSummaryViewModel> {
    const releaseDates = await this.calculateReleaseDatesService.getCalculationResults(
      username,
      calculationRequestId,
      token
    )
    const weekendAdjustments = await this.calculateReleaseDatesService.getWeekendAdjustments(
      username,
      releaseDates,
      token
    )
    try {
      const prisonerDetail = await this.viewReleaseDatesService.getPrisonerDetail(
        calculationRequestId,
        caseloads,
        token
      )
      const breakdown = await this.calculateReleaseDatesService.getBreakdown(calculationRequestId, token)
      return new CalculationSummaryViewModel(
        releaseDates.dates,
        weekendAdjustments,
        calculationRequestId,
        nomsId,
        prisonerDetail,
        breakdown?.calculationBreakdown,
        breakdown?.releaseDatesWithAdjustments
      )
    } catch (error) {
      if (error.status === 404 && error.data?.errorCode === 'PRISON_API_DATA_MISSING') {
        const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
        return new CalculationSummaryViewModel(
          releaseDates.dates,
          weekendAdjustments,
          calculationRequestId,
          nomsId,
          prisonerDetail,
          null,
          null,
          {
            messages: [
              {
                html: `To view the sentence and offence information and the calculation breakdown, you will need to <a href="/calculation/${nomsId}/check-information">calculate release dates again.</a>`,
              },
            ],
            messageType: ErrorMessageType.MISSING_PRISON_API_DATA,
          } as ErrorMessages,
          true
        )
      }
      throw error
    }
  }

  public calculationSummary: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const { caseloads, token, username } = res.locals.user
    const calculationRequestId = Number(req.params.calculationRequestId)
    res.render(
      'pages/view/calculationSummary',
      await this.calculateReleaseDatesViewModel(calculationRequestId, nomsId, username, token, caseloads)
    )
  }

  public printCalculationSummary: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, username } = res.locals.user
    const { nomsId } = req.params
    const calculationRequestId = Number(req.params.calculationRequestId)
    res.render(
      'pages/view/printCalculationSummary',
      await this.calculateReleaseDatesViewModel(calculationRequestId, nomsId, username, token, caseloads)
    )
  }
}

import { RequestHandler } from 'express'
import PrisonerService from '../services/prisonerService'
import SentenceAndOffenceViewModel from '../models/SentenceAndOffenceViewModel'
import ViewReleaseDatesService from '../services/viewReleaseDatesService'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import { FullPageError } from '../types/FullPageError'
import { ErrorMessages, ErrorMessageType } from '../types/ErrorMessages'

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
    const latestCalculation = await this.viewReleaseDatesService.getLatestCalculation(
      nomsId,
      prisonerDetail.bookingId,
      token
    )
    res.redirect(`/view/${latestCalculation.calculationRequestId}/sentences-and-offences`)
  }

  public sentencesAndOffences: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
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

      res.render('pages/view/sentencesAndOffences', {
        ...SentenceAndOffenceViewModel.from(prisonerDetail, sentencesAndOffences, adjustmentDetails),
        calculationRequestId,
      })
    } catch (error) {
      if (error.status === 404 && error.data?.errorCode === 'PRISON_API_DATA_MISSING') {
        res.redirect(`/view/${calculationRequestId}/calculation-summary`)
      } else {
        throw error
      }
    }
  }

  public calculationSummary: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, username } = res.locals.user
    const calculationRequestId = Number(req.params.calculationRequestId)
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
      res.render('pages/view/calculationSummary', {
        prisonerDetail,
        releaseDates: releaseDates.dates,
        weekendAdjustments,
        ...(await this.calculateReleaseDatesService.getBreakdown(calculationRequestId, token)),
      })
    } catch (error) {
      if (error.status === 404 && error.data?.errorCode === 'PRISON_API_DATA_MISSING') {
        res.render('pages/view/calculationSummary', {
          releaseDates: releaseDates.dates,
          weekendAdjustments,
          validationErrors: {
            messages: [
              {
                text: 'Missing data in order to display calculation breakdown or sentences and offences',
              },
            ],
            messageType: ErrorMessageType.MISSING_PRISON_API_DATA,
          } as ErrorMessages,
        })
      } else {
        throw error
      }
    }
  }

  public printCalculationSummary: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const calculationRequestId = Number(req.params.calculationRequestId)
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
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
    res.render('pages/calculation/printCalculationSummary', {
      prisonerDetail,
      releaseDates: releaseDates.dates,
      weekendAdjustments,
      ...(await this.calculateReleaseDatesService.getBreakdown(calculationRequestId, token)),
      calculationRequestId,
    })
  }
}

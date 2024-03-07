import { Request, RequestHandler } from 'express'
import { DateTime } from 'luxon'
import PrisonerService from '../services/prisonerService'
import ViewReleaseDatesService from '../services/viewReleaseDatesService'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import { ErrorMessages, ErrorMessageType } from '../types/ErrorMessages'
import { FullPageError } from '../types/FullPageError'
import CalculationSummaryViewModel from '../models/CalculationSummaryViewModel'
import EntryPointService from '../services/entryPointService'
import SentenceTypes from '../models/SentenceTypes'
import { GenuineOverrideRequest } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ViewRouteSentenceAndOffenceViewModel from '../models/ViewRouteSentenceAndOffenceViewModel'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'
import { longDateFormat } from '../utils/utils'
import config from '../config'
import ViewCalculateReleaseDatePageViewModel from '../models/ViewCalculateReleaseDatePageViewModel'
import SentenceAndOffencePageViewModel from '../models/SentenceAndOffencePageViewModel'
import { calculationSummaryDatesCardModelFromCalculationSummaryViewModel } from '../views/pages/components/calculation-summary-dates-card/CalculationSummaryDatesCardModel'

const overrideReasons = {
  terror: 'of terrorism or terror-related offences',
  warrantMismatch: 'the order of imprisonment/warrant doesn’t match trial record sheet',
}

export default class ViewRoutes {
  constructor(
    private readonly viewReleaseDatesService: ViewReleaseDatesService,
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
    private readonly entryPointService: EntryPointService,
  ) {
    // intentionally left blank
  }

  public startViewJourney: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    try {
      const latestCalculation = await this.viewReleaseDatesService.getLatestCalculation(
        nomsId,
        prisonerDetail.bookingId,
        token,
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
        token,
      )
      const sentencesAndOffences = await this.viewReleaseDatesService.getSentencesAndOffences(
        calculationRequestId,
        token,
      )
      const adjustmentDetails = await this.viewReleaseDatesService.getBookingAndSentenceAdjustments(
        calculationRequestId,
        token,
      )
      const calculationUserInputs = await this.viewReleaseDatesService.getCalculationUserInputs(
        calculationRequestId,
        token,
      )
      const returnToCustody = sentencesAndOffences.filter((s: PrisonApiOffenderSentenceAndOffences) =>
        SentenceTypes.isSentenceFixedTermRecall(s),
      ).length
        ? await this.viewReleaseDatesService.getReturnToCustodyDate(calculationRequestId, token)
        : null

      res.render(
        'pages/view/sentencesAndOffences',
        new SentenceAndOffencePageViewModel(
          new ViewRouteSentenceAndOffenceViewModel(
            prisonerDetail,
            calculationUserInputs,
            this.entryPointService.isDpsEntryPoint(req),
            sentencesAndOffences,
            adjustmentDetails,
            true,
            returnToCustody,
          ),
          calculationRequestId,
          nomsId,
        ),
      )
    } catch (error) {
      if (error.status === 404 && error.data?.errorCode === 'PRISON_API_DATA_MISSING') {
        res.redirect(`/view/${nomsId}/calculation-summary/${calculationRequestId}`)
      } else {
        throw error
      }
    }
  }

  private indexBy(dates: { [key: string]: string }) {
    const result = {}
    Object.keys(dates).forEach((dateType: string) => {
      result[dateType] = DateTime.fromFormat(dates[dateType], 'yyyy-MM-d').toFormat('cccc, dd LLLL yyyy')
    })
    return result
  }

  private async calculateReleaseDatesViewModel(
    calculationRequestId: number,
    nomsId: string,
    username: string,
    token: string,
    caseloads: string[],
    req: Request,
  ): Promise<CalculationSummaryViewModel> {
    const releaseDates = await this.calculateReleaseDatesService.getCalculationResults(
      username,
      calculationRequestId,
      token,
    )
    const weekendAdjustments = await this.calculateReleaseDatesService.getWeekendAdjustments(
      username,
      releaseDates,
      token,
    )
    const nonFridayReleaseAdjustments = await this.calculateReleaseDatesService.getNonFridayReleaseAdjustments(
      releaseDates,
      token,
    )

    try {
      const prisonerDetail = await this.viewReleaseDatesService.getPrisonerDetail(
        calculationRequestId,
        caseloads,
        token,
      )
      const breakdown = await this.calculateReleaseDatesService.getBreakdown(calculationRequestId, token)
      const sentencesAndOffences = await this.viewReleaseDatesService.getSentencesAndOffences(
        calculationRequestId,
        token,
      )
      const bookingCalculation = await this.calculateReleaseDatesService.getCalculationResults(
        username,
        calculationRequestId,
        token,
      )

      const override = await this.getOverride(releaseDates.calculationReference, token)
      const hasNone = releaseDates.dates.None !== undefined
      const approvedDates = releaseDates.approvedDates ? this.indexBy(releaseDates.approvedDates) : null
      return new CalculationSummaryViewModel(
        releaseDates.dates,
        weekendAdjustments,
        calculationRequestId,
        nomsId,
        prisonerDetail,
        sentencesAndOffences,
        hasNone,
        true,
        releaseDates.calculationReference,
        nonFridayReleaseAdjustments,
        config.featureToggles.calculationReasonToggle,
        bookingCalculation.calculationReason,
        bookingCalculation.otherReasonDescription,
        bookingCalculation.calculationDate === undefined
          ? undefined
          : longDateFormat(bookingCalculation.calculationDate),
        breakdown?.calculationBreakdown,
        breakdown?.releaseDatesWithAdjustments,
        null,
        false,
        this.entryPointService.isDpsEntryPoint(req),
        approvedDates,
        this.getOverrideReason(override),
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
          false,
          true,
          releaseDates.calculationReference,
          nonFridayReleaseAdjustments,
          config.featureToggles.calculationReasonToggle,
          null,
          null,
          null,
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
          true,
          this.entryPointService.isDpsEntryPoint(req),
        )
      }
      throw error
    }
  }

  private getOverrideReason(override: GenuineOverrideRequest): string {
    if (override && override.reason) {
      const reason = overrideReasons[override.reason]
      if (reason) {
        return reason
      }
      return override.reason.replace('Other: ', '')
    }
    return undefined
  }

  private async getOverride(calculationReference: string, token: string): Promise<GenuineOverrideRequest> {
    try {
      return await this.calculateReleaseDatesService.getGenuineOverride(calculationReference, token)
    } catch (error) {
      if (error.data.status === 404) {
        return Promise.resolve({} as never)
      }
      throw error
    }
  }

  public calculationSummary: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const { caseloads, token, username } = res.locals.user
    const calculationRequestId = Number(req.params.calculationRequestId)
    const model = await this.calculateReleaseDatesViewModel(
      calculationRequestId,
      nomsId,
      username,
      token,
      caseloads,
      req,
    )
    res.render(
      'pages/view/calculationSummary',
      new ViewCalculateReleaseDatePageViewModel(
        await this.calculateReleaseDatesViewModel(calculationRequestId, nomsId, username, token, caseloads, req),
        calculationSummaryDatesCardModelFromCalculationSummaryViewModel(model, model.hasNone),
      ),
    )
  }

  public printCalculationSummary: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, username } = res.locals.user
    const { nomsId } = req.params
    const calculationRequestId = Number(req.params.calculationRequestId)
    const model = await this.calculateReleaseDatesViewModel(
      calculationRequestId,
      nomsId,
      username,
      token,
      caseloads,
      req,
    )
    res.render(
      'pages/view/printCalculationSummary',
      new ViewCalculateReleaseDatePageViewModel(
        model,
        calculationSummaryDatesCardModelFromCalculationSummaryViewModel(model, model.hasNone),
      ),
    )
  }
}

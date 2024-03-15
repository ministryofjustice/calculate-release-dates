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
import { DetailedDate, GenuineOverrideRequest } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ViewRouteSentenceAndOffenceViewModel from '../models/ViewRouteSentenceAndOffenceViewModel'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'
import { longDateFormat } from '../utils/utils'
import config from '../config'
import ViewCalculateReleaseDatePageViewModel from '../models/ViewCalculateReleaseDatePageViewModel'
import SentenceAndOffencePageViewModel from '../models/SentenceAndOffencePageViewModel'
// eslint-disable-next-line prettier/prettier
import { calculationSummaryDatesCardModelFromCalculationSummaryViewModel } from '../views/pages/components/calculation-summary-dates-card/CalculationSummaryDatesCardModel'
import { approvedSummaryDatesCardModelFromCalculationSummaryViewModel } from '../views/pages/components/approved-summary-dates-card/ApprovedSummaryDatesCardModel'

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

  private indexBy(dates: { [key: string]: string } | { [key: string]: DetailedDate }) {
    const result = {}
    Object.keys(dates).forEach((dateType: string) => {
      const date = dates[dateType]
      if (typeof date === 'string') {
        result[dateType] = DateTime.fromFormat(date, 'yyyy-MM-d').toFormat('cccc, dd LLLL yyyy')
      } else {
        result[dateType] = DateTime.fromFormat(date.date, 'yyyy-MM-d').toFormat('cccc, dd LLLL yyyy')
      }
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
    const detailedCalculationResults = await this.calculateReleaseDatesService.getDetailedCalculationResults(
      username,
      calculationRequestId,
      token,
    )
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    const { calculationBreakdown, calculationOriginalData, breakdownMissingReason } = detailedCalculationResults
    if (!calculationBreakdown && breakdownMissingReason && breakdownMissingReason === 'PRISON_API_DATA_MISSING') {
      return new CalculationSummaryViewModel(
        calculationRequestId,
        nomsId,
        prisonerDetail,
        null,
        false,
        true,
        detailedCalculationResults.context.calculationReference,
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
        undefined,
        null,
        detailedCalculationResults,
      )
    }
    const breakdownReleaseDatesWithAdjustments =
      this.calculateReleaseDatesService.extractReleaseDatesWithAdjustments(calculationBreakdown)

    const override = await this.getOverride(detailedCalculationResults.context.calculationReference, token)
    const hasNone = detailedCalculationResults.dates.None !== undefined
    const approvedDates = detailedCalculationResults.approvedDates
      ? this.indexBy(detailedCalculationResults.approvedDates)
      : null
    return new CalculationSummaryViewModel(
      calculationRequestId,
      nomsId,
      prisonerDetail,
      calculationOriginalData.sentencesAndOffences,
      hasNone,
      true,
      detailedCalculationResults.context.calculationReference,
      config.featureToggles.calculationReasonToggle,
      detailedCalculationResults.context.calculationReason,
      detailedCalculationResults.context.otherReasonDescription,
      detailedCalculationResults.context.calculationDate === undefined
        ? undefined
        : longDateFormat(detailedCalculationResults.context.calculationDate),
      calculationBreakdown,
      breakdownReleaseDatesWithAdjustments,
      null,
      false,
      this.entryPointService.isDpsEntryPoint(req),
      approvedDates,
      this.getOverrideReason(override),
      detailedCalculationResults,
    )
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
        model,
        calculationSummaryDatesCardModelFromCalculationSummaryViewModel(model, model.hasNone),
        approvedSummaryDatesCardModelFromCalculationSummaryViewModel(model, false),
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
        approvedSummaryDatesCardModelFromCalculationSummaryViewModel(model, false),
      ),
    )
  }
}

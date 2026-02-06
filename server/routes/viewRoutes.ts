import { RequestHandler } from 'express'
import { DateTime } from 'luxon'
import PrisonerService from '../services/prisonerService'
import ViewReleaseDatesService from '../services/viewReleaseDatesService'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import { ErrorMessages, ErrorMessageType } from '../types/ErrorMessages'
import { FullPageError } from '../types/FullPageError'
import CalculationSummaryViewModel from '../models/calculation/CalculationSummaryViewModel'
import SentenceTypes from '../models/SentenceTypes'
import { DetailedDate } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ViewRouteSentenceAndOffenceViewModel from '../models/ViewRouteSentenceAndOffenceViewModel'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'
import { longDateFormat } from '../utils/utils'
import ViewCalculateReleaseDatePageViewModel from '../models/ViewCalculateReleaseDatePageViewModel'
import SentenceAndOffencePageViewModel from '../models/SentenceAndOffencePageViewModel'
import {
  calculationSummaryDatesCardModelFromCalculationSummaryViewModel,
  calculationSummaryDatesCardModelFromOverridesViewModel,
  filteredListOfDates,
} from '../views/pages/components/calculation-summary-dates-card/CalculationSummaryDatesCardModel'
import { approvedSummaryDatesCardModelFromCalculationSummaryViewModel } from '../views/pages/components/approved-summary-dates-card/ApprovedSummaryDatesCardModel'
import ViewPastNomisCalculationPageViewModel from '../models/ViewPastNomisCalculationPageViewModel'
import PrintNotificationSlipViewModel from '../models/PrintNotificationSlipViewModel'
import config from '../config'
import { hasGenuineOverridesAccess } from './genuine-overrides/genuineOverrideUtils'
import CalculationSummaryOverridesViewModel from '../models/calculation/CalculationSummaryOverridesViewModel'

export default class ViewRoutes {
  constructor(
    private readonly viewReleaseDatesService: ViewReleaseDatesService,
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
  ) {
    // intentionally left blank
  }

  public startViewJourney: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, userRoles, username } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, username, caseloads, userRoles)
    try {
      const latestCalculation = await this.viewReleaseDatesService.getLatestCalculation(
        nomsId,
        prisonerDetail.bookingId,
        username,
      )
      res.redirect(`/view/${nomsId}/sentences-and-offences/${latestCalculation.calculationRequestId}`)
    } catch (error) {
      if ((error.status ?? error.responseStatus) === 404) {
        throw FullPageError.noCalculationSubmitted(nomsId, prisonerDetail)
      }
    }
  }

  public sentencesAndOffences: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, userRoles, username } = res.locals.user
    const { nomsId } = req.params
    const calculationRequestId = Number(req.params.calculationRequestId)
    await this.prisonerService.checkPrisonerAccess(nomsId, username, caseloads, userRoles)
    try {
      const prisonerDetail = await this.viewReleaseDatesService.getPrisonerDetail(calculationRequestId, username)
      const sentencesAndOffences = await this.viewReleaseDatesService.getSentencesAndOffences(
        calculationRequestId,
        username,
      )
      const adjustmentDetails = await this.viewReleaseDatesService.getBookingAndSentenceAdjustments(
        calculationRequestId,
        username,
      )
      const adjustmentDtos = config.featureToggles.adjustmentsIntegrationEnabled
        ? await this.viewReleaseDatesService.getAdjustmentsDtosForCalculation(calculationRequestId, username)
        : []
      const calculationUserInputs = await this.viewReleaseDatesService.getCalculationUserInputs(
        calculationRequestId,
        username,
      )
      const detailedCalculationResults = await this.calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments(
        calculationRequestId,
        username,
      )
      const returnToCustody = sentencesAndOffences.filter((s: PrisonApiOffenderSentenceAndOffences) =>
        SentenceTypes.isSentenceFixedTermRecall(s),
      ).length
        ? await this.viewReleaseDatesService.getReturnToCustodyDate(calculationRequestId, username)
        : null

      res.render(
        'pages/view/sentencesAndOffences',
        new SentenceAndOffencePageViewModel(
          new ViewRouteSentenceAndOffenceViewModel(
            prisonerDetail,
            calculationUserInputs,
            sentencesAndOffences,
            adjustmentDetails,
            detailedCalculationResults.context.calculationType,
            returnToCustody,
            null,
            detailedCalculationResults.context.calculationReason,
            detailedCalculationResults.context.otherReasonDescription,
            detailedCalculationResults.context.calculationDate === undefined
              ? undefined
              : longDateFormat(detailedCalculationResults.context.calculationDate),
            adjustmentDtos,
            detailedCalculationResults.context.genuineOverrideReasonDescription,
            detailedCalculationResults.context.calculatedByDisplayName,
            detailedCalculationResults.context.calculatedAtPrisonDescription,
          ),
          calculationRequestId,
          nomsId,
        ),
      )
    } catch (error) {
      if ((error.status ?? error.responseStatus) === 404 && error.data?.errorCode === 'PRISON_API_DATA_MISSING') {
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
        result[dateType] = DateTime.fromFormat(date, 'yyyy-MM-d').toFormat('cccc, dd MMMM yyyy')
      } else {
        result[dateType] = DateTime.fromFormat(date.date, 'yyyy-MM-d').toFormat('cccc, dd MMMM yyyy')
      }
    })
    return result
  }

  private async calculateReleaseDatesViewModel(
    calculationRequestId: number,
    nomsId: string,
    caseloads: string[],
    userRoles: string[],
    username: string,
  ): Promise<CalculationSummaryViewModel> {
    const detailedCalculationResults = await this.calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments(
      calculationRequestId,
      username,
    )
    const hasErsed = 'ERSED' in detailedCalculationResults.dates
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, username, caseloads, userRoles)
    const { calculationBreakdown, calculationOriginalData, breakdownMissingReason, releaseDatesWithAdjustments } =
      detailedCalculationResults
    if (!calculationBreakdown && breakdownMissingReason && breakdownMissingReason === 'PRISON_API_DATA_MISSING') {
      return new CalculationSummaryViewModel(
        calculationRequestId,
        nomsId,
        prisonerDetail,
        null,
        false,
        true,
        detailedCalculationResults.context.calculationType,
        detailedCalculationResults.context.calculationReference,
        hasErsed,
        null,
        null,
        null,
        null,
        null,
        {
          messages: [
            {
              html: `To view the sentence and offence information and the calculation breakdown, you will need to <a href="/calculation/${nomsId}/reason">calculate release dates again.</a>`,
            },
          ],
          messageType: ErrorMessageType.MISSING_PRISON_API_DATA,
        } as ErrorMessages,
        true,
        undefined,
        detailedCalculationResults,
        hasGenuineOverridesAccess(),
        detailedCalculationResults.context.genuineOverrideReasonDescription,
        detailedCalculationResults.context.calculatedByDisplayName,
        detailedCalculationResults.context.calculatedAtPrisonDescription,
      )
    }
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
      detailedCalculationResults.context.calculationType,
      detailedCalculationResults.context.calculationReference,
      hasErsed,
      detailedCalculationResults.context.calculationReason,
      detailedCalculationResults.context.otherReasonDescription,
      detailedCalculationResults.context.calculationDate === undefined
        ? undefined
        : longDateFormat(detailedCalculationResults.context.calculationDate),
      calculationBreakdown,
      releaseDatesWithAdjustments,
      null,
      false,
      approvedDates,
      detailedCalculationResults,
      hasGenuineOverridesAccess(),
      detailedCalculationResults.context.genuineOverrideReasonDescription,
      detailedCalculationResults.context.calculatedByDisplayName,
      detailedCalculationResults.context.calculatedAtPrisonDescription,
    )
  }

  private async calculateReleaseDatesOverridesViewModel(
    calculationRequestId: number,
    nomsId: string,
    caseloads: string[],
    userRoles: string[],
    username: string,
  ) {
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, username, caseloads, userRoles)
    const overrideResults = await this.calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments(
      calculationRequestId,
      username,
    )

    const overrideRequestId = overrideResults.context.overridesCalculationRequestId
    const currentResults = await this.calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments(
      overrideRequestId,
      username,
    )

    const overrideReason = currentResults.context.genuineOverrideReasonDescription
    const overrideDates = Object.values(overrideResults.dates)
    const currentDates = Object.values(currentResults.dates)

    const crdsDateLines = calculationSummaryDatesCardModelFromOverridesViewModel(currentDates)
    const overrideDateLines = calculationSummaryDatesCardModelFromOverridesViewModel(overrideDates)

    return new CalculationSummaryOverridesViewModel(
      calculationRequestId,
      nomsId,
      prisonerDetail,
      overrideResults.context.calculatedByDisplayName,
      overrideReason,
      crdsDateLines,
      overrideDateLines,
    )
  }

  public calculationSummary: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const { caseloads, userRoles, username } = res.locals.user
    const calculationRequestId = Number(req.params.calculationRequestId)
    await this.prisonerService.checkPrisonerAccess(nomsId, username, caseloads, userRoles)
    const model = await this.calculateReleaseDatesViewModel(
      calculationRequestId,
      nomsId,
      caseloads,
      userRoles,
      username,
    )
    res.render(
      'pages/view/calculationSummary',
      new ViewCalculateReleaseDatePageViewModel(
        model,
        calculationSummaryDatesCardModelFromCalculationSummaryViewModel(model, model.hasNone),
        approvedSummaryDatesCardModelFromCalculationSummaryViewModel(model, false),
        nomsId,
      ),
    )
  }

  public calculationSummaryOverrides: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const { caseloads, userRoles, username } = res.locals.user
    const calculationRequestId = Number(req.params.calculationRequestId)
    await this.prisonerService.checkPrisonerAccess(nomsId, username, caseloads, userRoles)

    const model = await this.calculateReleaseDatesOverridesViewModel(
      calculationRequestId,
      nomsId,
      caseloads,
      userRoles,
      username,
    )

    res.render('pages/view/calculationSummaryOverrides', { model })
  }

  public printCalculationSummary: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, userRoles, username } = res.locals.user
    const { nomsId } = req.params
    const calculationRequestId = Number(req.params.calculationRequestId)
    await this.prisonerService.checkPrisonerAccess(nomsId, username, caseloads, userRoles)
    const model = await this.calculateReleaseDatesViewModel(
      calculationRequestId,
      nomsId,
      caseloads,
      userRoles,
      username,
    )
    res.render(
      'pages/view/printCalculationSummary',
      new ViewCalculateReleaseDatePageViewModel(
        model,
        calculationSummaryDatesCardModelFromCalculationSummaryViewModel(model, model.hasNone),
        approvedSummaryDatesCardModelFromCalculationSummaryViewModel(model, false),
        nomsId,
      ),
    )
  }

  public printNotificationSlip: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, userRoles, username } = res.locals.user
    const { nomsId } = req.params
    const calculationRequestId = Number(req.params.calculationRequestId)
    const { fromPage, pageType } = req.query as Record<string, string>

    await this.prisonerService.checkPrisonerAccess(nomsId, username, caseloads, userRoles)

    const [prisonerDetail, sentencesAndOffences, adjustmentDetails, releaseDateAndCalcContext, adjustmentsDtos] =
      await Promise.all([
        this.viewReleaseDatesService.getPrisonerDetail(calculationRequestId, username),
        this.viewReleaseDatesService.getSentencesAndOffences(calculationRequestId, username),
        this.viewReleaseDatesService.getBookingAndSentenceAdjustments(calculationRequestId, username),
        this.calculateReleaseDatesService.getReleaseDatesForACalcReqId(calculationRequestId, username),
        config.featureToggles.adjustmentsIntegrationEnabled
          ? this.viewReleaseDatesService.getAdjustmentsDtosForCalculation(calculationRequestId, username)
          : Promise.resolve([]),
      ])

    const hasDTOSentence = sentencesAndOffences.some(sentence => SentenceTypes.isSentenceDto(sentence))
    const hasOnlyDTOSentences = sentencesAndOffences.every(sentence => SentenceTypes.isSentenceDto(sentence))
    const datesArray = Object.values(releaseDateAndCalcContext.dates)
      .filter(dateObject => dateObject && dateObject.date && filteredListOfDates.includes(dateObject.type))
      .map(dateObject => ({ code: dateObject.type, description: dateObject.description, date: dateObject.date }))

    const reasonForCalculation =
      releaseDateAndCalcContext.calculation.calculationReason != null
        ? releaseDateAndCalcContext.calculation.calculationReason.displayName
        : 'Not specified'

    res.render(
      'pages/printNotification/printNotificationSlip',
      new PrintNotificationSlipViewModel(
        new ViewRouteSentenceAndOffenceViewModel(
          prisonerDetail,
          null,
          sentencesAndOffences,
          adjustmentDetails,
          null,
          null,
          null,
          null,
          null,
          null,
          adjustmentsDtos,
          null,
          null,
          null,
        ),
        calculationRequestId,
        nomsId,
        releaseDateAndCalcContext.calculation.calculationDate,
        datesArray,
        fromPage,
        pageType,
        reasonForCalculation,
        hasDTOSentence,
        hasOnlyDTOSentences,
      ),
    )
  }

  public nomisCalculationSummary: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const { caseloads, userRoles, username } = res.locals.user
    const offenderSentCalculationId = Number(req.params.offenderSentCalculationId)
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, username, caseloads, userRoles)
    const pastNomisCalculation = await this.calculateReleaseDatesService.getNomisCalculationSummary(
      offenderSentCalculationId,
      username,
    )
    res.render(
      'pages/view/nomisCalculationSummary',
      new ViewPastNomisCalculationPageViewModel(
        prisonerDetail,
        pastNomisCalculation.calculatedAt,
        pastNomisCalculation.reason,
        'NOMIS',
        calculationSummaryDatesCardModelFromCalculationSummaryViewModel(pastNomisCalculation, false),
        pastNomisCalculation.calculatedByDisplayName,
      ),
    )
  }
}

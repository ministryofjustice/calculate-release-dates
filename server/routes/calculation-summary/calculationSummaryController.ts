import { Request, Response } from 'express'
import { DateTime } from 'luxon'
import { Controller } from '../controller'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import PrisonerService from '../../services/prisonerService'
import { CalculationSummaryForm } from './calculationSummarySchema'
import CalculationSummaryViewModel from '../../models/calculation/CalculationSummaryViewModel'
import { FullPageError } from '../../types/FullPageError'
import CalculationSummaryPageViewModel from '../../models/calculation/CalculationSummaryPageViewModel'
import { calculationSummaryDatesCardModelFromCalculationSummaryViewModel } from '../../views/pages/components/calculation-summary-dates-card/CalculationSummaryDatesCardModel'
import {
  ApprovedDateActionConfig,
  approvedSummaryDatesCardModelFromCalculationSummaryViewModel,
} from '../../views/pages/components/approved-summary-dates-card/ApprovedSummaryDatesCardModel'
import { ManualJourneySelectedDate } from '../../types/ManualJourney'
import { saveCalculation } from '../saveCalculationHelper'
import GenuineOverrideUrls from '../genuine-overrides/genuineOverrideUrls'
import { hasGenuineOverridesAccess } from '../genuine-overrides/genuineOverrideUtils'
import { getSiblingCalculationWithPreviouslyRecordedSLED } from '../../utils/previouslyRecordedSledUtils'

export default class CalculationSummaryController implements Controller {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
  ) {}

  GET = async (req: Request<{ nomsId: string; calculationRequestId: string }>, res: Response): Promise<void> => {
    const { caseloads, token, userRoles } = res.locals.user
    const { nomsId } = req.params
    const { callbackUrl } = req.query as Record<string, string>
    await this.prisonerService.checkPrisonerAccess(nomsId, token, caseloads, userRoles)
    const calculationRequestId = Number(req.params.calculationRequestId)
    const detailedCalculationResults = await this.calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments(
      calculationRequestId,
      token,
    )
    if (detailedCalculationResults.context.prisonerId !== nomsId) {
      throw FullPageError.notFoundError()
    }
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, token, caseloads, userRoles)
    const serverErrors = req.flash('serverErrors')
    let validationErrors = null
    if (serverErrors && serverErrors[0]) {
      validationErrors = JSON.parse(serverErrors[0])
    }
    let approvedDates
    if (this.hasBeenAskedApprovedDatesQuestion(req, nomsId)) {
      req.session.selectedApprovedDates[nomsId] = req.session.selectedApprovedDates[nomsId].filter(
        d => d.completed === true,
      )
      approvedDates = this.indexBy(req.session.selectedApprovedDates[nomsId])
    }
    if (!req.session.HDCED) {
      req.session.HDCED = {}
    }
    if (!req.session.HDCED_WEEKEND_ADJUSTED) {
      req.session.HDCED_WEEKEND_ADJUSTED = {}
    }
    if (detailedCalculationResults.dates.HDCED) {
      req.session.HDCED[nomsId] = detailedCalculationResults.dates.HDCED.date
      const hcedWeekendAdjusted = await this.calculateReleaseDatesService.getNextWorkingDay(
        detailedCalculationResults.dates.HDCED.date,
        token,
      )
      req.session.HDCED_WEEKEND_ADJUSTED[nomsId] =
        detailedCalculationResults.dates.HDCED.date != null && hcedWeekendAdjusted != null
    }

    const model = new CalculationSummaryViewModel(
      calculationRequestId,
      nomsId,
      prisonerDetail,
      detailedCalculationResults.calculationOriginalData.sentencesAndOffences,
      false,
      false,
      null,
      detailedCalculationResults.context.calculationReference,
      false,
      null,
      null,
      null,
      detailedCalculationResults.calculationBreakdown,
      detailedCalculationResults.releaseDatesWithAdjustments,
      validationErrors,
      false,
      approvedDates,
      detailedCalculationResults,
      hasGenuineOverridesAccess(),
    )
    const siblingCalculationWithoutPreviouslyRecordedSLED = getSiblingCalculationWithPreviouslyRecordedSLED(
      req,
      calculationRequestId,
    )
    let backLink: string
    if (detailedCalculationResults.usedPreviouslyRecordedSLED) {
      backLink = `/calculation/${nomsId}/previously-recorded-sled-intercept/${calculationRequestId}`
    } else if (siblingCalculationWithoutPreviouslyRecordedSLED) {
      backLink = `/calculation/${nomsId}/previously-recorded-sled-intercept/${siblingCalculationWithoutPreviouslyRecordedSLED}`
    } else {
      backLink = `/calculation/${nomsId}/check-information`
    }
    return res.render(
      'pages/calculation/calculationSummary',
      new CalculationSummaryPageViewModel(
        model,
        calculationSummaryDatesCardModelFromCalculationSummaryViewModel(model, false),
        approvedSummaryDatesCardModelFromCalculationSummaryViewModel(model, true, {
          nomsId,
          calculationRequestId,
        } as ApprovedDateActionConfig),
        req.session.isAddDatesFlow?.[nomsId],
        callbackUrl || req.originalUrl,
        backLink,
      ),
    )
  }

  POST = async (
    req: Request<{ nomsId: string; calculationRequestId: string }, unknown, CalculationSummaryForm>,
    res: Response,
  ): Promise<void> => {
    const { nomsId } = req.params
    const { agreeWithDates } = req.body
    const calculationRequestId = Number(req.params.calculationRequestId)

    if (agreeWithDates === 'NO') {
      if (req.session.genuineOverrideInputs) {
        delete req.session.genuineOverrideInputs[nomsId]
      }
      res.redirect(GenuineOverrideUrls.startGenuineOverride(nomsId, calculationRequestId))
      return
    }
    if (!this.hasBeenAskedApprovedDatesQuestion(req, nomsId)) {
      if (req.session.isAddDatesFlow[nomsId]) {
        res.redirect(`/calculation/${nomsId}/${calculationRequestId}/select-approved-dates`)
      } else {
        res.redirect(`/calculation/${nomsId}/${calculationRequestId}/approved-dates-question`)
      }
      return
    }

    await saveCalculation(
      req,
      res,
      this.calculateReleaseDatesService,
      `/calculation/${nomsId}/summary/${calculationRequestId}`,
    )
  }

  private hasBeenAskedApprovedDatesQuestion(req: Request, nomsId: string) {
    return (
      req.session.selectedApprovedDates &&
      req.session.selectedApprovedDates[nomsId] &&
      req.session.selectedApprovedDates[nomsId].length > 0
    )
  }

  private indexBy(dates: ManualJourneySelectedDate[]) {
    const result = {}
    dates.forEach(date => {
      const dateString = `${date.manualEntrySelectedDate.date.year}-${date.manualEntrySelectedDate.date.month}-${date.manualEntrySelectedDate.date.day}`
      result[date.dateType] = DateTime.fromFormat(dateString, 'yyyy-M-d').toFormat('cccc, dd LLLL yyyy')
    })
    return result
  }
}

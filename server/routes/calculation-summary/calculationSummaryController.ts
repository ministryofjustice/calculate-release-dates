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
import { ManualEntrySelectedDate } from '../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { ManualJourneySelectedDate } from '../../types/ManualJourney'
import { ErrorMessages, ErrorMessageType } from '../../types/ErrorMessages'
import logger from '../../../logger'
import { nunjucksEnv } from '../../utils/nunjucksSetup'

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
    if (
      req.session.selectedApprovedDates &&
      req.session.selectedApprovedDates[nomsId] &&
      req.session.selectedApprovedDates[nomsId].length > 0
    ) {
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
    )
    return res.render(
      'pages/calculation/calculationSummary',
      new CalculationSummaryPageViewModel(
        model,
        calculationSummaryDatesCardModelFromCalculationSummaryViewModel(model, false),
        approvedSummaryDatesCardModelFromCalculationSummaryViewModel(model, true, {
          nomsId,
          calculationRequestId,
        } as ApprovedDateActionConfig),
        req.session.isAddDatesFlow,
        callbackUrl || req.originalUrl,
      ),
    )
  }

  POST = async (
    req: Request<{ nomsId: string; calculationRequestId: string }, unknown, CalculationSummaryForm>,
    res: Response,
  ): Promise<void> => {
    const { token, username } = res.locals.user
    const { nomsId } = req.params
    const calculationRequestId = Number(req.params.calculationRequestId)
    const breakdownHtml = await this.getBreakdownFragment(calculationRequestId, token)

    const approvedDates: ManualJourneySelectedDate[] =
      req.session.selectedApprovedDates != null && req.session.selectedApprovedDates[nomsId] != null
        ? req.session.selectedApprovedDates[nomsId]
        : []

    const newApprovedDates: ManualEntrySelectedDate[] = approvedDates.map(d => d.manualEntrySelectedDate)
    try {
      const bookingCalculation = await this.calculateReleaseDatesService.confirmCalculation(
        username,
        nomsId,
        calculationRequestId,
        token,
        {
          calculationFragments: {
            breakdownHtml,
          },
          approvedDates: newApprovedDates,
          isSpecialistSupport: false,
        },
      )
      res.redirect(`/calculation/${nomsId}/complete/${bookingCalculation.calculationRequestId}`)
    } catch (error) {
      // TODO Move handling of validation errors from the api into the service layer
      logger.error(error)
      if (error.status === 412) {
        req.flash(
          'serverErrors',
          JSON.stringify({
            messages: [
              {
                text: 'The booking data that was used for this calculation has changed, go back to the Check NOMIS Information screen to see the changes',
                href: `/calculation/${nomsId}/check-information`,
              },
            ],
          } as ErrorMessages),
        )
      } else {
        req.flash(
          'serverErrors',
          JSON.stringify({
            messages: [{ text: 'The calculation could not be saved in NOMIS.' }],
            messageType: ErrorMessageType.SAVE_DATES,
          } as ErrorMessages),
        )
      }
      res.redirect(`/calculation/${nomsId}/summary/${calculationRequestId}`)
    }
  }

  private indexBy(dates: ManualJourneySelectedDate[]) {
    const result = {}
    dates.forEach(date => {
      const dateString = `${date.manualEntrySelectedDate.date.year}-${date.manualEntrySelectedDate.date.month}-${date.manualEntrySelectedDate.date.day}`
      result[date.dateType] = DateTime.fromFormat(dateString, 'yyyy-M-d').toFormat('cccc, dd LLLL yyyy')
    })
    return result
  }

  private async getBreakdownFragment(calculationRequestId: number, token: string): Promise<string> {
    return nunjucksEnv().render('pages/fragments/breakdownFragment.njk', {
      model: {
        ...(await this.calculateReleaseDatesService.getBreakdown(calculationRequestId, token)),
        showBreakdown: () => true,
      },
    })
  }
}

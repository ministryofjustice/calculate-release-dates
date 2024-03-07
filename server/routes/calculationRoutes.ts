import { RequestHandler } from 'express'
import { DateTime } from 'luxon'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import PrisonerService from '../services/prisonerService'
import logger from '../../logger'
import EntryPointService from '../services/entryPointService'
import { ErrorMessages, ErrorMessageType } from '../types/ErrorMessages'
import { nunjucksEnv } from '../utils/nunjucksSetup'
import { FullPageError } from '../types/FullPageError'
import CalculationSummaryViewModel from '../models/CalculationSummaryViewModel'
import UserInputService from '../services/userInputService'
import ViewReleaseDatesService from '../services/viewReleaseDatesService'
import { ManualEntrySelectedDate } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import CalculationCompleteViewModel from '../models/CalculationCompleteViewModel'
import CalculationSummaryPageViewModel from '../models/CalculationSummaryPageViewModel'
import { calculationSummaryDatesCardModelFromCalculationSummaryViewModel } from '../views/pages/components/calculation-summary-dates-card/CalculationSummaryDatesCardModel'

export default class CalculationRoutes {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
    private readonly entryPointService: EntryPointService,
    private readonly userInputService: UserInputService,
    private readonly viewReleaseDatesService: ViewReleaseDatesService,
  ) {
    // intentionally left blank
  }

  public calculationSummary: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const calculationRequestId = Number(req.params.calculationRequestId)
    if (
      req.session.selectedApprovedDates &&
      req.session.selectedApprovedDates[nomsId] &&
      req.session.selectedApprovedDates[nomsId].some((date: ManualEntrySelectedDate) => date.date === undefined)
    ) {
      req.session.selectedApprovedDates[nomsId] = []
    }
    const releaseDates = await this.calculateReleaseDatesService.getCalculationResults(
      username,
      calculationRequestId,
      token,
    )
    if (releaseDates.prisonerId !== nomsId) {
      throw FullPageError.notFoundError()
    }
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    const weekendAdjustments = await this.calculateReleaseDatesService.getWeekendAdjustments(
      username,
      releaseDates,
      token,
    )
    const nonFridayReleaseAdjustments = await this.calculateReleaseDatesService.getNonFridayReleaseAdjustments(
      releaseDates,
      token,
    )
    const serverErrors = req.flash('serverErrors')
    let validationErrors = null
    if (serverErrors && serverErrors[0]) {
      validationErrors = JSON.parse(serverErrors[0])
    }
    const breakdown = await this.calculateReleaseDatesService.getBreakdown(calculationRequestId, token)
    const sentencesAndOffences = await this.viewReleaseDatesService.getSentencesAndOffences(calculationRequestId, token)
    let approvedDates
    if (
      req.session.selectedApprovedDates &&
      req.session.selectedApprovedDates[nomsId] &&
      req.session.selectedApprovedDates[nomsId].length > 0
    ) {
      approvedDates = this.indexBy(req.session.selectedApprovedDates[nomsId])
    }
    if (!req.session.HDCED) {
      req.session.HDCED = {}
    }
    if (!req.session.HDCED_WEEKEND_ADJUSTED) {
      req.session.HDCED_WEEKEND_ADJUSTED = {}
    }
    if (releaseDates.dates.HDCED) {
      req.session.HDCED[nomsId] = releaseDates.dates.HDCED
      req.session.HDCED_WEEKEND_ADJUSTED[nomsId] =
        weekendAdjustments.HDCED != null && weekendAdjustments.HDCED.date != null
    }
    const model = new CalculationSummaryViewModel(
      releaseDates.dates,
      weekendAdjustments,
      calculationRequestId,
      nomsId,
      prisonerDetail,
      sentencesAndOffences,
      false,
      false,
      releaseDates.calculationReference,
      nonFridayReleaseAdjustments,
      false,
      null,
      null,
      null,
      breakdown?.calculationBreakdown,
      breakdown?.releaseDatesWithAdjustments,
      validationErrors,
      false,
      false,
      approvedDates,
    )
    res.render(
      'pages/calculation/calculationSummary',
      new CalculationSummaryPageViewModel(
        model,
        calculationSummaryDatesCardModelFromCalculationSummaryViewModel(model, false),
      ),
    )
  }

  private indexBy(dates: ManualEntrySelectedDate[]) {
    const result = {}
    dates.forEach(date => {
      const dateString = `${date.date.year}-${date.date.month}-${date.date.day}`
      result[date.dateType] = DateTime.fromFormat(dateString, 'yyyy-M-d').toFormat('cccc, dd LLLL yyyy')
    })
    return result
  }

  private indexApprovedDates(dates: { [key: string]: string }) {
    const result = {}
    Object.keys(dates).forEach((dateType: string) => {
      result[dateType] = DateTime.fromFormat(dates[dateType], 'yyyy-MM-d').toFormat('cccc, dd LLLL yyyy')
    })
    return result
  }

  public printCalculationSummary: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const calculationRequestId = Number(req.params.calculationRequestId)
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    const releaseDates = await this.calculateReleaseDatesService.getCalculationResults(
      username,
      calculationRequestId,
      token,
    )
    if (releaseDates.prisonerId !== nomsId) {
      throw FullPageError.notFoundError()
    }
    const weekendAdjustments = await this.calculateReleaseDatesService.getWeekendAdjustments(
      username,
      releaseDates,
      token,
    )
    const nonFridayReleaseAdjustments = await this.calculateReleaseDatesService.getNonFridayReleaseAdjustments(
      releaseDates,
      token,
    )

    const breakdown = await this.calculateReleaseDatesService.getBreakdown(calculationRequestId, token)
    const sentencesAndOffences = await this.viewReleaseDatesService.getSentencesAndOffences(calculationRequestId, token)
    const hasNone = 'None' in releaseDates.dates
    const approvedDates = releaseDates.approvedDates ? this.indexApprovedDates(releaseDates.approvedDates) : null
    const model = new CalculationSummaryViewModel(
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
      false,
      null,
      null,
      null,
      breakdown?.calculationBreakdown,
      breakdown?.releaseDatesWithAdjustments,
      null,
      false,
      false,
      approvedDates,
    )
    res.render(
      'pages/calculation/printCalculationSummary',
      new CalculationSummaryPageViewModel(
        model,
        calculationSummaryDatesCardModelFromCalculationSummaryViewModel(model, hasNone),
      ),
    )
  }

  public submitCalculationSummary: RequestHandler = async (req, res): Promise<void> => {
    const { username, token } = res.locals.user
    const { nomsId } = req.params
    const calculationRequestId = Number(req.params.calculationRequestId)
    const breakdownHtml = await this.getBreakdownFragment(calculationRequestId, token)
    const approvedDates =
      req.session.selectedApprovedDates != null && req.session.selectedApprovedDates[nomsId] != null
        ? req.session.selectedApprovedDates[nomsId]
        : []
    try {
      const bookingCalculation = await this.calculateReleaseDatesService.confirmCalculation(
        username,
        calculationRequestId,
        token,
        {
          calculationFragments: {
            breakdownHtml,
          },
          approvedDates,
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

  public complete: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const noDates: string = <string>req.query.noDates
    this.entryPointService.clearEntryPoint(res)
    const calculationRequestId = Number(req.params.calculationRequestId)
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    const calculation = await this.calculateReleaseDatesService.getCalculationResults(
      username,
      calculationRequestId,
      token,
    )
    if (calculation.prisonerId !== nomsId || calculation.calculationStatus !== 'CONFIRMED') {
      throw FullPageError.notFoundError()
    }
    this.userInputService.resetCalculationUserInputForPrisoner(req, nomsId)
    res.render(
      'pages/calculation/calculationComplete',
      new CalculationCompleteViewModel(prisonerDetail, calculationRequestId, noDates),
    )
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

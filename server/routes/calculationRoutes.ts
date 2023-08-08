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
import { ManualEntryDate } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

export default class CalculationRoutes {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
    private readonly entryPointService: EntryPointService,
    private readonly userInputService: UserInputService,
    private readonly viewReleaseDatesService: ViewReleaseDatesService
  ) {}

  public calculationSummary: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const calculationRequestId = Number(req.params.calculationRequestId)
    if (
      req.session.selectedApprovedDates &&
      req.session.selectedApprovedDates[nomsId] &&
      req.session.selectedApprovedDates[nomsId].some((date: ManualEntryDate) => date.date === undefined)
    ) {
      req.session.selectedApprovedDates[nomsId] = []
    }
    const releaseDates = await this.calculateReleaseDatesService.getCalculationResults(
      username,
      calculationRequestId,
      token
    )
    if (releaseDates.prisonerId !== nomsId) {
      throw FullPageError.notFoundError()
    }
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    const weekendAdjustments = await this.calculateReleaseDatesService.getWeekendAdjustments(
      username,
      releaseDates,
      token
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
      breakdown?.calculationBreakdown,
      breakdown?.releaseDatesWithAdjustments,
      validationErrors,
      false,
      false,
      approvedDates
    )

    res.render('pages/calculation/calculationSummary', { model })
  }

  private indexBy(dates: ManualEntryDate[]) {
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
      token
    )
    if (releaseDates.prisonerId !== nomsId) {
      throw FullPageError.notFoundError()
    }
    const weekendAdjustments = await this.calculateReleaseDatesService.getWeekendAdjustments(
      username,
      releaseDates,
      token
    )
    const breakdown = await this.calculateReleaseDatesService.getBreakdown(calculationRequestId, token)
    const sentencesAndOffences = await this.viewReleaseDatesService.getSentencesAndOffences(calculationRequestId, token)
    const hasNone = 'None' in releaseDates.dates
    let approvedDates
    if (releaseDates.approvedDates) {
      approvedDates = this.indexApprovedDates(releaseDates.approvedDates)
    } else {
      approvedDates = null
    }
    const model = new CalculationSummaryViewModel(
      releaseDates.dates,
      weekendAdjustments,
      calculationRequestId,
      nomsId,
      prisonerDetail,
      sentencesAndOffences,
      hasNone,
      true,
      breakdown?.calculationBreakdown,
      breakdown?.releaseDatesWithAdjustments,
      null,
      false,
      false,
      approvedDates
    )
    res.render('pages/calculation/printCalculationSummary', { model })
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
        }
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
          } as ErrorMessages)
        )
      } else {
        req.flash(
          'serverErrors',
          JSON.stringify({
            messages: [{ text: 'The calculation could not be saved in NOMIS.' }],
            messageType: ErrorMessageType.SAVE_DATES,
          } as ErrorMessages)
        )
      }
      res.redirect(`/calculation/${nomsId}/summary/${calculationRequestId}`)
    }
  }

  public complete: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const { noDates, manual } = req.query
    this.entryPointService.clearEntryPoint(res)
    const calculationRequestId = Number(req.params.calculationRequestId)
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    const calculation = await this.calculateReleaseDatesService.getCalculationResults(
      username,
      calculationRequestId,
      token
    )
    if (calculation.prisonerId !== nomsId || calculation.calculationStatus !== 'CONFIRMED') {
      throw FullPageError.notFoundError()
    }
    const hasApprovedDates =
      req.session.selectedApprovedDates != null &&
      req.session.selectedApprovedDates[nomsId] != null &&
      req.session.selectedApprovedDates[nomsId].length > 0
    this.userInputService.resetCalculationUserInputForPrisoner(req, nomsId)
    res.render('pages/calculation/calculationComplete', {
      prisonerDetail,
      calculationRequestId,
      noDates,
      manual,
      hasApprovedDates,
    })
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

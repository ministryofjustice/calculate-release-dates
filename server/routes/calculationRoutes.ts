import { RequestHandler } from 'express'
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
import { ManualEntrySelectedDate } from '../models/ManualEntrySelectedDate'

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
      req.session.selectedApprovedDates[nomsId].some((date: ManualEntrySelectedDate) => date.date === undefined)
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

    const model = new CalculationSummaryViewModel(
      releaseDates.dates,
      weekendAdjustments,
      calculationRequestId,
      nomsId,
      prisonerDetail,
      sentencesAndOffences,
      false,
      breakdown?.calculationBreakdown,
      breakdown?.releaseDatesWithAdjustments,
      validationErrors
    )

    res.render('pages/calculation/calculationSummary', { model })
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
    const model = new CalculationSummaryViewModel(
      releaseDates.dates,
      weekendAdjustments,
      calculationRequestId,
      nomsId,
      prisonerDetail,
      sentencesAndOffences,
      hasNone,
      breakdown?.calculationBreakdown,
      breakdown?.releaseDatesWithAdjustments
    )
    res.render('pages/calculation/printCalculationSummary', { model })
  }

  public submitCalculationSummary: RequestHandler = async (req, res): Promise<void> => {
    const { username, token } = res.locals.user
    const { nomsId } = req.params
    const calculationRequestId = Number(req.params.calculationRequestId)
    const breakdownHtml = await this.getBreakdownFragment(calculationRequestId, token)
    try {
      const bookingCalculation = await this.calculateReleaseDatesService.confirmCalculation(
        username,
        calculationRequestId,
        token,
        {
          breakdownHtml,
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
    this.userInputService.resetCalculationUserInputForPrisoner(req, nomsId)
    res.render('pages/calculation/calculationComplete', {
      prisonerDetail,
      calculationRequestId,
      noDates,
      manual,
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

import { RequestHandler } from 'express'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import PrisonerService from '../services/prisonerService'
import logger from '../../logger'
import { groupBy, indexBy, serverErrorToGovUkError, validationError } from '../utils/utils'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'
import EntryPointService from '../services/entryPointService'

export default class CalculationRoutes {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
    private readonly entryPointService: EntryPointService
  ) {}

  public checkInformation: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffences(
      username,
      prisonerDetail.bookingId,
      token
    )
    const adjustmentDetails = await this.prisonerService.getSentenceAdjustments(
      username,
      prisonerDetail.bookingId,
      token
    )

    try {
      res.render('pages/calculation/checkInformation', {
        prisonerDetail,
        sentencesAndOffences,
        adjustmentDetails,
        caseToSentences: groupBy(
          sentencesAndOffences,
          (sent: PrisonApiOffenderSentenceAndOffences) => sent.caseSequence
        ),
        sentenceSequenceToSentence: indexBy(
          sentencesAndOffences,
          (sent: PrisonApiOffenderSentenceAndOffences) => sent.sentenceSequence
        ),
        dpsEntryPoint: this.entryPointService.isDpsEntryPoint(req),
      })
    } catch (ex) {
      logger.error(ex)
      const validationErrors = serverErrorToGovUkError(ex.data, '#bookingData')

      res.render('pages/calculation/checkInformation', {
        prisonerDetail,
        validationErrors,
        sentencesAndOffences,
        adjustmentDetails,
        dpsEntryPoint: this.entryPointService.isDpsEntryPoint(req),
      })
    }
  }

  public submitCheckInformation: RequestHandler = async (req, res): Promise<void> => {
    const { username, token } = res.locals.user
    const { nomsId } = req.params
    try {
      const releaseDates = await this.calculateReleaseDatesService.calculatePreliminaryReleaseDates(
        username,
        nomsId,
        token
      )
      res.redirect(`/calculation/${nomsId}/summary/${releaseDates.calculationRequestId}`)
    } catch (ex) {
      // TODO Move handling of validation errors from the api into the service layer
      logger.error(ex)

      req.flash('validationErrors', JSON.stringify(serverErrorToGovUkError(ex.data, '#sentences')))
      res.redirect(`/calculation/${nomsId}/check-information`)
    }
  }

  public calculationSummary: RequestHandler = async (req, res): Promise<void> => {
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
    const calculationBreakdown = await this.calculateReleaseDatesService.getCalculationBreakdown(
      username,
      calculationRequestId,
      token
    )
    const effectiveDates = await this.calculateReleaseDatesService.getEffectiveDates(releaseDates, calculationBreakdown)
    res.render('pages/calculation/calculationSummary', {
      prisonerDetail,
      releaseDates: releaseDates.dates,
      weekendAdjustments,
      calculationBreakdown,
      effectiveDates,
    })
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
    const calculationBreakdown = await this.calculateReleaseDatesService.getCalculationBreakdown(
      username,
      calculationRequestId,
      token
    )
    const effectiveDates = await this.calculateReleaseDatesService.getEffectiveDates(releaseDates, calculationBreakdown)
    res.render('pages/calculation/printCalculationSummary', {
      prisonerDetail,
      releaseDates: releaseDates.dates,
      weekendAdjustments,
      calculationBreakdown,
      effectiveDates,
      calculationRequestId,
    })
  }

  public submitCalculationSummary: RequestHandler = async (req, res): Promise<void> => {
    const { username, token } = res.locals.user
    const { nomsId } = req.params
    const calculationRequestId = Number(req.params.calculationRequestId)
    try {
      const bookingCalculation = await this.calculateReleaseDatesService.confirmCalculation(
        username,
        nomsId,
        calculationRequestId,
        token
      )
      res.redirect(`/calculation/${nomsId}/complete/${bookingCalculation.calculationRequestId}`)
    } catch (error) {
      // TODO Move handling of validation errors from the api into the service layer
      logger.error(error)
      if (error.status === 412) {
        req.flash(
          'validationErrors',
          JSON.stringify(
            validationError(
              'The booking data that was used for this calculation has changed, go back to the Check NOMIS Information screen to see the changes',
              `/calculation/${nomsId}/check-information`
            )
          )
        )
      } else {
        req.flash('validationErrors', JSON.stringify(validationError(`${error.data.userMessage}`, '#sentences')))
      }
      res.redirect(`/calculation/${nomsId}/summary/${calculationRequestId}`)
    }
  }

  public complete: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId } = req.params
    this.entryPointService.clearEntryPoint(res)
    const calculationRequestId = Number(req.params.calculationRequestId)
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    res.render('pages/calculation/calculationComplete', { prisonerDetail, calculationRequestId })
  }
}

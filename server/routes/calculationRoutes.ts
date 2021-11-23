import { RequestHandler } from 'express'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import PrisonerService from '../services/prisonerService'
import logger from '../../logger'
import { groupBy, indexBy } from '../utils/utils'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'

export default class CalculationRoutes {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService
  ) {}

  public checkInformation: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads)
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffences(username, prisonerDetail.bookingId)
    const adjustmentDetails = await this.prisonerService.getSentenceAdjustments(username, prisonerDetail.bookingId)

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
      })
    } catch (ex) {
      logger.error(ex)
      const errorSummaryList = [
        {
          text: `There was an error in the calculation API service: ${ex.data.userMessage}`,
          href: '#bookingData',
        },
      ]

      res.render('pages/calculation/checkInformation', {
        prisonerDetail,
        errorSummaryList,
        sentencesAndOffences,
        adjustmentDetails,
      })
    }
  }

  public submitCheckInformation: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId } = req.params
    try {
      const releaseDates = await this.calculateReleaseDatesService.calculatePreliminaryReleaseDates(username, nomsId)
      res.redirect(`/calculation/${nomsId}/summary/${releaseDates.calculationRequestId}`)
    } catch (ex) {
      // TODO Move handling of validation errors from the api into the service layer
      logger.error(ex)

      req.flash(
        'validationErrors',
        JSON.stringify([
          {
            text: `There was an error in the calculation API service: ${ex.data.userMessage}`,
            href: '#sentences',
          },
        ])
      )
      res.redirect(`/calculation/${nomsId}/check-information`)
    }
  }

  public calculationSummary: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads } = res.locals.user
    const { nomsId } = req.params
    const calculationRequestId = Number(req.params.calculationRequestId)
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads)
    const releaseDates = await this.calculateReleaseDatesService.getCalculationResults(username, calculationRequestId)
    const weekendAdjustments = await this.calculateReleaseDatesService.getWeekendAdjustments(username, releaseDates)
    const calculationBreakdown = await this.calculateReleaseDatesService.getCalculationBreakdown(
      username,
      calculationRequestId
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
    const { username, caseloads } = res.locals.user
    const { nomsId } = req.params
    const calculationRequestId = Number(req.params.calculationRequestId)
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads)
    const releaseDates = await this.calculateReleaseDatesService.getCalculationResults(username, calculationRequestId)
    const weekendAdjustments = await this.calculateReleaseDatesService.getWeekendAdjustments(username, releaseDates)
    const calculationBreakdown = await this.calculateReleaseDatesService.getCalculationBreakdown(
      username,
      calculationRequestId
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
    const { username } = res.locals.user
    const { nomsId } = req.params
    const calculationRequestId = Number(req.params.calculationRequestId)
    try {
      const bookingCalculation = await this.calculateReleaseDatesService.confirmCalculation(
        username,
        nomsId,
        calculationRequestId
      )
      res.redirect(`/calculation/${nomsId}/complete/${bookingCalculation.calculationRequestId}`)
    } catch (error) {
      // TODO Move handling of validation errors from the api into the service layer
      logger.error(error)
      if (error.status === 412) {
        req.flash(
          'validationErrors',
          this.getValidationError(
            'The booking data that was used for this calculation has changed, go back to the Check NOMIS Information screen to see the changes',
            `/calculation/${nomsId}/check-information`
          )
        )
      } else {
        req.flash(
          'validationErrors',
          this.getValidationError(
            `There was an error in the calculation API service: ${error.data.userMessage}`,
            '#sentences'
          )
        )
      }
      res.redirect(`/calculation/${nomsId}/summary/${calculationRequestId}`)
    }
  }

  private getValidationError(text: string, href: string) {
    return JSON.stringify([
      {
        text,
        href,
      },
    ])
  }

  public complete: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads } = res.locals.user
    const { nomsId } = req.params
    const calculationRequestId = Number(req.params.calculationRequestId)
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads)
    res.render('pages/calculation/calculationComplete', { prisonerDetail, calculationRequestId })
  }
}

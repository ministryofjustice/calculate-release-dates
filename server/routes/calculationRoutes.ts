import { RequestHandler } from 'express'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import PrisonerService from '../services/prisonerService'
import logger from '../../logger'

export default class CalculationRoutes {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService
  ) {}

  public checkInformation: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId)
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffences(username, prisonerDetail.bookingId)
    const adjustmentDetails = await this.prisonerService.getSentenceAdjustments(username, prisonerDetail.bookingId)
    try {
      res.render('pages/calculation/checkInformation', {
        prisonerDetail,
        sentencesAndOffences,
        adjustmentDetails,
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
      // TODO This is just a generic exception handler at the moment - will evolve to handle specific errors and a general one
      logger.error(ex)

      req.flash(
        'validationErrors',
        JSON.stringify([
          {
            text: `There was an error in the calculation API service: ${ex.data.userMessage}`,
            href: '#sentence-table',
          },
        ])
      )
      res.redirect(`/calculation/${nomsId}/check-information`)
    }
  }

  public calculationSummary: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId } = req.params
    const calculationRequestId = Number(req.params.calculationRequestId)
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId)
    const releaseDates = await this.calculateReleaseDatesService.getCalculationResults(username, calculationRequestId)
    res.render('pages/calculation/calculationSummary', {
      prisonerDetail,
      releaseDates: releaseDates.dates,
    })
  }

  public submitCalculationSummary: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId, calculationRequestId } = req.params
    try {
      await this.calculateReleaseDatesService.confirmCalculation(username, nomsId)
      res.redirect(`/calculation/${nomsId}/complete`)
    } catch (ex) {
      // TODO This is just a generic exception handler at the moment - will evolve to handle specific errors and a general one
      logger.error(ex)

      req.flash(
        'validationErrors',
        JSON.stringify([
          {
            text: `There was an error in the calculation API service: ${ex.data.userMessage}`,
            href: '#sentence-table',
          },
        ])
      )
      res.redirect(`/calculation/${nomsId}/summary/${calculationRequestId}`)
    }
  }

  public complete: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId)
    res.render('pages/calculation/calculationComplete', { prisonerDetail })
  }
}

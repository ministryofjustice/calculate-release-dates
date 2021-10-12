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
      const releaseDates = await this.calculateReleaseDatesService.calculatePreliminaryReleaseDates(username, nomsId)
      res.render('pages/checkInformation', {
        prisonerDetail,
        releaseDates: releaseDates ? JSON.stringify(releaseDates, undefined, 4) : '',
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

      res.render('pages/checkInformation', {
        prisonerDetail,
        errorSummaryList,
        sentencesAndOffences,
        adjustmentDetails,
      })
    }
  }

  public summary: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId)
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffences(username, prisonerDetail.bookingId)
    const adjustmentDetails = await this.prisonerService.getSentenceAdjustments(username, prisonerDetail.bookingId)
    try {
      const releaseDates = await this.calculateReleaseDatesService.calculatePreliminaryReleaseDates(username, nomsId)
      res.render('pages/calculationSummary', {
        prisonerDetail,
        releaseDates: releaseDates ? JSON.stringify(releaseDates, undefined, 4) : '',
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

      res.render('pages/calculationSummary', {
        prisonerDetail,
        errorSummaryList,
        sentencesAndOffences,
        adjustmentDetails,
      })
    }
  }

  public complete: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId)
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffences(username, prisonerDetail.bookingId)
    const adjustmentDetails = await this.prisonerService.getSentenceAdjustments(username, prisonerDetail.bookingId)
    try {
      const releaseDates = await this.calculateReleaseDatesService.calculatePreliminaryReleaseDates(username, nomsId)
      res.render('pages/calculationComplete', {
        prisonerDetail,
        releaseDates: releaseDates ? JSON.stringify(releaseDates, undefined, 4) : '',
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

      res.render('pages/calculationComplete', {
        prisonerDetail,
        errorSummaryList,
        sentencesAndOffences,
        adjustmentDetails,
      })
    }
  }
}

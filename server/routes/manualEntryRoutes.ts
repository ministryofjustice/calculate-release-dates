import { RequestHandler } from 'express'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import SentenceAndOffenceViewModel from '../models/SentenceAndOffenceViewModel'

export default class ManualEntryRoutes {
  constructor(private readonly calculateReleaseDatesService: CalculateReleaseDatesService) {}

  public landingPage: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const unsupportedSentenceOrCalculationMessages =
      await this.calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages(nomsId, token)
    if (unsupportedSentenceOrCalculationMessages.length === 0) {
      return res.redirect(`/calculation/${nomsId}/check-information`)
    }
    return res.render('pages/manualEntry/manualEntry', {})
  }
}

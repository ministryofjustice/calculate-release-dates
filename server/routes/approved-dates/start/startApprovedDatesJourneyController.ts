import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { Controller } from '../../controller'
import { ApprovedDatesJourney } from '../../../@types/journeys'
import CalculateReleaseDatesService from '../../../services/calculateReleaseDatesService'
import ApprovedDatesUrls from '../approvedDateUrls'

export default class StartApprovedDatesJourney implements Controller {
  constructor(private readonly calculateReleaseDatesService: CalculateReleaseDatesService) {}

  private MAX_JOURNEYS = 5

  GET = async (req: Request<{ nomsId: string }>, res: Response): Promise<void> => {
    const { nomsId } = req.params
    const journey: ApprovedDatesJourney = {
      id: uuidv4(),
      lastTouched: new Date().toISOString(),
      nomsId,
      preliminaryCalculationRequestId: 0,
    }
    if (!req.session.approvedDatesJourneys) {
      req.session.approvedDatesJourneys = {}
    }
    req.session.approvedDatesJourneys[journey.id] = journey
    if (Object.entries(req.session.approvedDatesJourneys).length > this.MAX_JOURNEYS) {
      Object.values(req.session.approvedDatesJourneys)
        .sort(
          (a: ApprovedDatesJourney, b: ApprovedDatesJourney) =>
            new Date(b.lastTouched).getTime() - new Date(a.lastTouched).getTime(),
        )
        .slice(this.MAX_JOURNEYS)
        .forEach(journeyToRemove => delete req.session.approvedDatesJourneys![journeyToRemove.id])
    }
    res.redirect(ApprovedDatesUrls.reviewCalculatedDates(nomsId, journey.id))
  }
}

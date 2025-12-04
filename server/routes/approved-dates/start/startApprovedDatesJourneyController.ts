import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { Controller } from '../../controller'
import { ApprovedDatesJourney } from '../../../@types/journeys'
import CalculateReleaseDatesService from '../../../services/calculateReleaseDatesService'
import ApprovedDatesUrls from '../approvedDateUrls'
import { ApprovedDatesInputResponse } from '../../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

export default class StartApprovedDatesJourney implements Controller {
  constructor(private readonly calculateReleaseDatesService: CalculateReleaseDatesService) {}

  private MAX_JOURNEYS = 5

  GET = async (req: Request<{ nomsId: string }>, res: Response): Promise<void> => {
    const { nomsId } = req.params
    const { token } = res.locals.user
    const inputs = await this.calculateReleaseDatesService.getApprovedDatesInputs(nomsId, token)
    if (inputs.approvedDatesAvailable) {
      this.approvedDatesAvailable(nomsId, inputs, req, res)
    } else {
      await this.redirectToFullCalculation(nomsId, token, req, res)
    }
  }

  private approvedDatesAvailable(nomsId: string, inputs: ApprovedDatesInputResponse, req: Request, res: Response) {
    const journey: ApprovedDatesJourney = {
      id: uuidv4(),
      lastTouched: new Date().toISOString(),
      nomsId,
      preliminaryCalculationRequestId: inputs.calculatedReleaseDates.calculationRequestId,
      datesToSave: [],
      datesBeingAdded: [],
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

  private async redirectToFullCalculation(nomsId: string, token: string, req: Request, res: Response) {
    // set the reason to approved dates to save users a step
    const reasonToUseForApprovedDates = await this.calculateReleaseDatesService
      .getCalculationReasons(token)
      .then(reasons => reasons.find(it => it.useForApprovedDates))
    if (req.session.calculationReasonId == null) {
      req.session.calculationReasonId = {}
    }
    if (req.session.otherReasonDescription == null) {
      req.session.otherReasonDescription = {}
    }
    req.session.calculationReasonId[nomsId] = reasonToUseForApprovedDates.id
    req.session.otherReasonDescription[nomsId] = null
    res.redirect(`/calculation/${nomsId}/check-information`)
  }
}

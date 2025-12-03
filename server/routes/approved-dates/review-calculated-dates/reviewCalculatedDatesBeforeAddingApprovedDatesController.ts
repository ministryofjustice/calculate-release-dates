import { Request, Response } from 'express'
import { Controller } from '../../controller'
import CalculateReleaseDatesService from '../../../services/calculateReleaseDatesService'
import PrisonerService from '../../../services/prisonerService'
import DateTypeConfigurationService from '../../../services/dateTypeConfigurationService'
import { PersonJourneyParams } from '../../../@types/journeys'
import ReviewCalculatedDatesBeforeAddingApprovedDatesViewModel from '../../../models/approved-dates/ReviewCalculatedDatesBeforeAddingApprovedDatesViewModel'
import ApprovedDatesUrls from '../approvedDateUrls'

export default class ReviewCalculatedDatesBeforeAddingApprovedDatesController implements Controller {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
    private readonly dateTypeConfigurationService: DateTypeConfigurationService,
  ) {}

  GET = async (req: Request<PersonJourneyParams>, res: Response): Promise<void> => {
    const { nomsId, journeyId } = req.params
    const { caseloads, token, userRoles } = res.locals.user

    const journey = req.session.approvedDatesJourneys[journeyId]
    const detailedCalculationResults = await this.calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments(
      journey.preliminaryCalculationRequestId,
      token,
    )
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, token, caseloads, userRoles)

    return res.render(
      'pages/approvedDates/reviewCalculatedDatesBeforeAddingApprovedDates.njk',
      new ReviewCalculatedDatesBeforeAddingApprovedDatesViewModel(
        prisonerDetail,
        detailedCalculationResults,
        `/?prisonId=${nomsId}`,
        ApprovedDatesUrls.reviewCalculatedDates(nomsId, journeyId),
      ),
    )
  }

  POST = async (req: Request<PersonJourneyParams>, res: Response): Promise<void> => {
    const { nomsId, journeyId } = req.params
    return res.redirect(ApprovedDatesUrls.reviewApprovedDates(nomsId, journeyId))
  }
}

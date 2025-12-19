import { Request, Response } from 'express'
import { Controller } from '../../controller'
import PrisonerService from '../../../services/prisonerService'
import DateTypeConfigurationService from '../../../services/dateTypeConfigurationService'
import { DeleteDateForm } from '../../common-schemas/deleteDateSchema'
import { PersonJourneyParams } from '../../../@types/journeys'
import ApprovedDatesUrls from '../approvedDateUrls'
import ApprovedDeleteDateViewModel from '../../../models/approved-dates/ApprovedDeleteDateViewModel'

export default class DeleteApprovedDateController implements Controller {
  constructor(
    private readonly dateTypeConfigurationService: DateTypeConfigurationService,
    private readonly prisonerService: PrisonerService,
  ) {}

  GET = async (req: Request<PersonJourneyParams & { dateType: string }>, res: Response): Promise<void> => {
    const { nomsId, journeyId, dateType } = req.params
    const { caseloads, token, userRoles } = res.locals.user

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, token, caseloads, userRoles)

    const journey = req.session.approvedDatesJourneys[journeyId]

    // if the date type hasn't been saved before go back to review dates to allow choosing a date or to add it back if it was removed
    const existingDate = journey?.datesToSave?.find(it => it.type === dateType)
    if (!existingDate) {
      return res.redirect(ApprovedDatesUrls.reviewApprovedDates(nomsId, journeyId))
    }

    const description = await this.dateTypeConfigurationService
      .dateTypeToDescriptionMapping(token)
      .then(descriptions => descriptions[dateType])

    return res.render(
      'pages/approvedDates/standalone/deleteDate',
      new ApprovedDeleteDateViewModel(
        prisonerDetail,
        description,
        ApprovedDatesUrls.deleteDate(nomsId, journeyId, dateType),
      ),
    )
  }

  POST = async (
    req: Request<PersonJourneyParams & { dateType: string }, unknown, DeleteDateForm>,
    res: Response,
  ): Promise<void> => {
    const { nomsId, journeyId, dateType } = req.params
    const journey = req.session.approvedDatesJourneys[journeyId]
    const { confirmDeleteDate } = req.body
    const dateToDelete = journey.datesToSave?.find(it => it.type === dateType)
    if (confirmDeleteDate === 'YES' && dateToDelete) {
      journey.datesToSave.splice(journey.datesToSave?.indexOf(dateToDelete), 1)
    }
    return res.redirect(ApprovedDatesUrls.reviewApprovedDates(nomsId, journeyId))
  }
}

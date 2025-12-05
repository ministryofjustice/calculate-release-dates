import { Request, Response } from 'express'
import dayjs from 'dayjs'
import { Controller } from '../../controller'
import PrisonerService from '../../../services/prisonerService'
import { ReleaseDateForm } from '../../common-schemas/releaseDateSchemas'
import DateTypeConfigurationService from '../../../services/dateTypeConfigurationService'
import { dateToDayMonthYear } from '../../../utils/utils'
import { PersonJourneyParams } from '../../../@types/journeys'
import ApprovedDatesUrls from '../approvedDateUrls'
import EnterApprovedDateViewModel from '../../../models/approved-dates/EnterApprovedDateViewModel'

export default class EditApprovedDateController implements Controller {
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
    const parsedDate = dateToDayMonthYear(existingDate.date)

    const day = res.locals?.formResponses?.day ?? parsedDate.day
    const month = res.locals?.formResponses?.month ?? parsedDate.month
    const year = res.locals?.formResponses?.year ?? parsedDate.year

    const description = await this.dateTypeConfigurationService
      .dateTypeToDescriptionMapping(token)
      .then(descriptions => descriptions[dateType])

    return res.render(
      'pages/approvedDates/standalone/enterDate',
      new EnterApprovedDateViewModel(
        prisonerDetail,
        day,
        month,
        year,
        description,
        ApprovedDatesUrls.reviewApprovedDates(nomsId, journeyId),
        ApprovedDatesUrls.editDate(nomsId, journeyId, dateType),
      ),
    )
  }

  POST = async (
    req: Request<PersonJourneyParams & { dateType: string }, unknown, ReleaseDateForm>,
    res: Response,
  ): Promise<void> => {
    const { nomsId, journeyId, dateType } = req.params
    const journey = req.session.approvedDatesJourneys[journeyId]
    const { day, month, year } = req.body
    const dateBeingSet = journey.datesToSave.find(it => it.type === dateType)
    dateBeingSet.date = dayjs(`${year}-${month}-${day}`).format('YYYY-MM-DD')
    return res.redirect(ApprovedDatesUrls.reviewApprovedDates(nomsId, journeyId))
  }
}

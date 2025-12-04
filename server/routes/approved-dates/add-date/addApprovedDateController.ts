import { Request, Response } from 'express'
import dayjs from 'dayjs'
import { Controller } from '../../controller'
import PrisonerService from '../../../services/prisonerService'
import { ReleaseDateForm } from '../../common-schemas/releaseDateSchemas'
import DateTypeConfigurationService from '../../../services/dateTypeConfigurationService'
import { PersonJourneyParams } from '../../../@types/journeys'
import ApprovedDatesUrls from '../approvedDateUrls'
import EnterApprovedDateViewModel from '../../../models/approved-dates/EnterApprovedDateViewModel'
import { getApprovedDatePreviousDateUrl, getApprovedDatesNextAction } from '../approvedDatesUtils'

export default class AddApprovedDateController implements Controller {
  constructor(
    private readonly dateTypeConfigurationService: DateTypeConfigurationService,
    private readonly prisonerService: PrisonerService,
  ) {}

  GET = async (req: Request<PersonJourneyParams & { dateType: string }>, res: Response): Promise<void> => {
    const { nomsId, journeyId, dateType } = req.params
    const { caseloads, token, userRoles } = res.locals.user

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, token, caseloads, userRoles)

    const journey = req.session.approvedDatesJourneys[journeyId]

    // if the add mini-journey has already completed return to date select otherwise populate with the previously entered values
    const inProgressDate = journey?.datesBeingAdded?.find(it => it.type === dateType)
    if (!inProgressDate) {
      return res.redirect(ApprovedDatesUrls.selectDatesToAdd(nomsId, journeyId))
    }
    const day = res.locals?.formResponses?.day ?? inProgressDate?.day
    const month = res.locals?.formResponses?.month ?? inProgressDate?.month
    const year = res.locals?.formResponses?.year ?? inProgressDate?.year

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
        getApprovedDatePreviousDateUrl(nomsId, journeyId, dateType, journey?.datesBeingAdded ?? []),
        ApprovedDatesUrls.enterNewDate(nomsId, journeyId, dateType),
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
    const dateBeingSet = journey.datesBeingAdded.find(it => it.type === dateType)
    dateBeingSet.day = day
    dateBeingSet.month = month
    dateBeingSet.year = year

    const nextAction = getApprovedDatesNextAction(nomsId, journeyId, dateType, journey.datesBeingAdded)
    if (nextAction.action === 'SAVE_ALL_DATES') {
      journey.datesBeingAdded.forEach(it => {
        journey.datesToSave.push({
          type: it.type,
          date: dayjs(`${it.year}-${it.month}-${it.day}`).format('YYYY-MM-DD'),
        })
      })
      journey.datesBeingAdded = []
    }
    return res.redirect(nextAction.url)
  }
}

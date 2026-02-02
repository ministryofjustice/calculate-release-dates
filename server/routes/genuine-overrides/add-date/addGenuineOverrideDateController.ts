import { Request, Response } from 'express'
import dayjs from 'dayjs'
import { Controller } from '../../controller'
import GenuineOverrideUrls from '../genuineOverrideUrls'
import {
  genuineOverrideInputsForPrisoner,
  getGenuineOverrideNextAction,
  getGenuineOverridePreviousDateUrl,
} from '../genuineOverrideUtils'
import PrisonerService from '../../../services/prisonerService'
import { ReleaseDateForm } from '../../common-schemas/releaseDateSchemas'
import GenuineOverrideEnterDateViewModel from '../../../models/genuine-override/GenuineOverrideEnterDateViewModel'
import DateTypeConfigurationService from '../../../services/dateTypeConfigurationService'

export default class AddGenuineOverrideDateController implements Controller {
  constructor(
    private readonly dateTypeConfigurationService: DateTypeConfigurationService,
    private readonly prisonerService: PrisonerService,
  ) {}

  GET = async (
    req: Request<{
      nomsId: string
      calculationRequestId: string
      dateType: string
    }>,
    res: Response,
  ): Promise<void> => {
    const { nomsId, calculationRequestId, dateType } = req.params
    const { caseloads, userRoles, username } = res.locals.user

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, username, caseloads, userRoles)

    const genuineOverrideInputs = genuineOverrideInputsForPrisoner(req, nomsId)

    // if the add mini-journey has already completed return to date select otherwise populate with the previously entered values
    const inProgressDate = genuineOverrideInputs?.datesBeingAdded?.find(it => it.type === dateType)
    if (!inProgressDate) {
      return res.redirect(GenuineOverrideUrls.selectDatesToAdd(nomsId, calculationRequestId))
    }
    const day = res.locals?.formResponses?.day ?? inProgressDate?.day
    const month = res.locals?.formResponses?.month ?? inProgressDate?.month
    const year = res.locals?.formResponses?.year ?? inProgressDate?.year

    const description = await this.dateTypeConfigurationService
      .dateTypeToDescriptionMapping(username)
      .then(descriptions => descriptions[dateType])

    return res.render(
      'pages/genuineOverrides/enterDate',
      new GenuineOverrideEnterDateViewModel(
        prisonerDetail,
        day,
        month,
        year,
        description,
        getGenuineOverridePreviousDateUrl(
          nomsId,
          calculationRequestId,
          dateType,
          genuineOverrideInputs?.datesBeingAdded ?? [],
        ),
        GenuineOverrideUrls.enterNewDate(nomsId, calculationRequestId, dateType),
      ),
    )
  }

  POST = async (
    req: Request<{ nomsId: string; calculationRequestId: string; dateType: string }, unknown, ReleaseDateForm>,
    res: Response,
  ): Promise<void> => {
    const { nomsId, calculationRequestId, dateType } = req.params
    const genuineOverrideInputs = genuineOverrideInputsForPrisoner(req, nomsId)
    const { day, month, year } = req.body
    const dateBeingSet = genuineOverrideInputs.datesBeingAdded.find(it => it.type === dateType)
    dateBeingSet.day = day
    dateBeingSet.month = month
    dateBeingSet.year = year

    const nextAction = getGenuineOverrideNextAction(
      nomsId,
      calculationRequestId,
      dateType,
      genuineOverrideInputs.datesBeingAdded,
    )
    if (nextAction.action === 'SAVE_ALL_DATES') {
      genuineOverrideInputs.datesBeingAdded.forEach(it => {
        genuineOverrideInputs.datesToSave.push({
          type: it.type,
          date: dayjs(`${it.year}-${it.month}-${it.day}`).format('YYYY-MM-DD'),
        })
      })
      genuineOverrideInputs.datesBeingAdded = []
    }
    return res.redirect(nextAction.url)
  }
}

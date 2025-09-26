import { Request, Response } from 'express'
import dayjs from 'dayjs'
import { Controller } from '../../controller'
import GenuineOverrideUrls from '../genuineOverrideUrls'
import { genuineOverrideInputsForPrisoner } from '../genuineOverrideUtils'
import PrisonerService from '../../../services/prisonerService'
import { ReleaseDateForm } from '../../common-schemas/releaseDateSchemas'
import GenuineOverrideEnterDateViewModel from '../../../models/genuine-override/GenuineOverrideEnterDateViewModel'
import DateTypeConfigurationService from '../../../services/dateTypeConfigurationService'

export default class EditGenuineOverrideDateController implements Controller {
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
    const { caseloads, token, userRoles } = res.locals.user

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, token, caseloads, userRoles)

    const genuineOverrideInputs = genuineOverrideInputsForPrisoner(req, nomsId)

    // if the date type hasn't been saved before go back to review dates to allow choosing a date or to add it back if it was removed
    const existingDate = genuineOverrideInputs?.datesToSave?.find(it => it.type === dateType)
    if (!existingDate) {
      return res.redirect(GenuineOverrideUrls.reviewDatesForOverride(nomsId, calculationRequestId))
    }
    const parsedDate = dayjs(existingDate.date)

    const day = res.locals?.formResponses?.day ?? parsedDate.date()
    const month = res.locals?.formResponses?.month ?? parsedDate.month() + 1 // months are 0 indexed in JS
    const year = res.locals?.formResponses?.year ?? parsedDate.year()

    const description = await this.dateTypeConfigurationService
      .dateTypeToDescriptionMapping(token)
      .then(descriptions => descriptions[dateType])

    return res.render(
      'pages/genuineOverrides/enterDate',
      new GenuineOverrideEnterDateViewModel(
        prisonerDetail,
        day,
        month,
        year,
        description,
        GenuineOverrideUrls.reviewDatesForOverride(nomsId, calculationRequestId),
        GenuineOverrideUrls.editDate(nomsId, calculationRequestId, dateType),
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
    const dateBeingSet = genuineOverrideInputs.datesToSave.find(it => it.type === dateType)
    dateBeingSet.date = dayjs(`${year}-${month}-${day}`).format('YYYY-MM-DD')
    return res.redirect(GenuineOverrideUrls.reviewDatesForOverride(nomsId, calculationRequestId))
  }
}

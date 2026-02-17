import { Request, Response } from 'express'
import { Controller } from '../../controller'
import GenuineOverrideUrls from '../genuineOverrideUrls'
import { genuineOverrideInputsForPrisoner } from '../genuineOverrideUtils'
import PrisonerService from '../../../services/prisonerService'
import DateTypeConfigurationService from '../../../services/dateTypeConfigurationService'
import GenuineOverrideDeleteDateViewModel from '../../../models/genuine-override/GenuineOverrideDeleteDateViewModel'
import { DeleteDateForm } from '../../common-schemas/deleteDateSchema'

export default class DeleteGenuineOverrideDateController implements Controller {
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

    // if the date type hasn't been saved before go back to review dates to allow choosing a date or to add it back if it was removed
    const existingDate = genuineOverrideInputs?.datesToSave?.find(it => it.type === dateType)
    if (!existingDate) {
      return res.redirect(GenuineOverrideUrls.reviewDatesForOverride(nomsId, calculationRequestId))
    }

    const description = await this.dateTypeConfigurationService
      .dateTypeToDescriptionMapping(username)
      .then(descriptions => descriptions[dateType])

    return res.render(
      'pages/genuineOverrides/deleteDate',
      new GenuineOverrideDeleteDateViewModel(
        prisonerDetail,
        description,
        GenuineOverrideUrls.deleteDate(nomsId, calculationRequestId, dateType),
      ),
    )
  }

  POST = async (
    req: Request<
      {
        nomsId: string
        calculationRequestId: string
        dateType: string
      },
      unknown,
      DeleteDateForm
    >,
    res: Response,
  ): Promise<void> => {
    const { nomsId, calculationRequestId, dateType } = req.params
    const genuineOverrideInputs = genuineOverrideInputsForPrisoner(req, nomsId)
    const { confirmDeleteDate } = req.body
    const dateToDelete = genuineOverrideInputs.datesToSave?.find(it => it.type === dateType)
    if (confirmDeleteDate === 'YES' && dateToDelete) {
      genuineOverrideInputs.datesToSave.splice(genuineOverrideInputs.datesToSave?.indexOf(dateToDelete), 1)
    }
    return res.redirect(GenuineOverrideUrls.reviewDatesForOverride(nomsId, calculationRequestId))
  }
}

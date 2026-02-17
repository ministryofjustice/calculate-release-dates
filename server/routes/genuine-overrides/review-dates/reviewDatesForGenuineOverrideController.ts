import { Request, Response } from 'express'
import { Controller } from '../../controller'
import GenuineOverrideUrls from '../genuineOverrideUrls'
import { genuineOverrideInputsForPrisoner } from '../genuineOverrideUtils'
import CalculateReleaseDatesService from '../../../services/calculateReleaseDatesService'
import PrisonerService from '../../../services/prisonerService'
import ReviewDatesForGenuineOverrideViewModel from '../../../models/genuine-override/ReviewDatesForGenuineOverrideViewModel'
import DateTypeConfigurationService from '../../../services/dateTypeConfigurationService'
import {
  GenuineOverrideRequest,
  GenuineOverrideRequestReasonCode,
  ManualEntrySelectedDateType,
} from '../../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import {
  convertValidationMessagesToErrorMessagesForPath,
  redirectToInputWithErrors,
} from '../../../middleware/validationMiddleware'
import { sortDisplayableDates } from '../../../utils/utils'

export default class ReviewDatesForGenuineOverrideController implements Controller {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
    private readonly dateTypeConfigurationService: DateTypeConfigurationService,
  ) {}

  GET = async (req: Request<{ nomsId: string; calculationRequestId: string }>, res: Response): Promise<void> => {
    const { nomsId, calculationRequestId } = req.params
    const { caseloads, userRoles, username } = res.locals.user

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, username, caseloads, userRoles)
    const genuineOverrideInputs = genuineOverrideInputsForPrisoner(req, nomsId)
    if (genuineOverrideInputs.datesToSave?.length === 0) {
      return res.redirect(GenuineOverrideUrls.selectDatesToAdd(nomsId, calculationRequestId))
    }
    sortDisplayableDates(genuineOverrideInputs.datesToSave)
    const dateTypeDefinitions = await this.dateTypeConfigurationService.dateTypeToDescriptionMapping(
      username,
      'DESCRIPTION_ONLY',
    )
    return res.render(
      'pages/genuineOverrides/reviewDatesForGenuineOverride',
      new ReviewDatesForGenuineOverrideViewModel(
        prisonerDetail,
        Number(calculationRequestId),
        genuineOverrideInputs.datesToSave,
        dateTypeDefinitions,
        GenuineOverrideUrls.selectReasonForOverride(nomsId, calculationRequestId),
        GenuineOverrideUrls.reviewDatesForOverride(nomsId, calculationRequestId),
      ),
    )
  }

  POST = async (req: Request<{ nomsId: string; calculationRequestId: string }>, res: Response): Promise<void> => {
    const { nomsId, calculationRequestId } = req.params
    const { username, token } = res.locals.user
    const inputs = genuineOverrideInputsForPrisoner(req, nomsId)
    const request: GenuineOverrideRequest = {
      reason: inputs.reason as GenuineOverrideRequestReasonCode,
      reasonFurtherDetail: inputs.reasonFurtherDetail,
      dates: inputs.datesToSave.map(date => ({
        dateType: date.type as ManualEntrySelectedDateType,
        date: date.date,
      })),
    }
    const response = await this.calculateReleaseDatesService.createGenuineOverrideForCalculation(
      username,
      nomsId,
      Number(calculationRequestId),
      request,
      token,
    )
    if (!response.success) {
      return redirectToInputWithErrors(
        req,
        res,
        convertValidationMessagesToErrorMessagesForPath('datesToSave', response.validationMessages),
      )
    }
    return res.redirect(`/calculation/${nomsId}/complete/${response.newCalculationRequestId}`)
  }
}

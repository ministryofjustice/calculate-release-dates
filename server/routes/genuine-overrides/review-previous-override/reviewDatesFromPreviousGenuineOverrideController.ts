import { Request, Response } from 'express'
import { Controller } from '../../controller'
import GenuineOverrideUrls from '../genuineOverrideUrls'
import { genuineOverrideInputsForPrisoner, sortDatesForGenuineOverride } from '../genuineOverrideUtils'
import CalculateReleaseDatesService from '../../../services/calculateReleaseDatesService'
import PrisonerService from '../../../services/prisonerService'
import DateTypeConfigurationService from '../../../services/dateTypeConfigurationService'
import {
  GenuineOverrideRequest,
  GenuineOverrideRequestReasonCode,
  ManualEntrySelectedDateType,
} from '../../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ReviewDatesFromPreviousGenuineOverrideViewModel from '../../../models/genuine-override/ReviewDatesFromPreviousGenuineOverrideViewModel'
import { ReviewDatesFromPreviousOverrideSummaryForm } from './reviewDatesFromPreviousOverrideSummarySchema'
import {
  convertValidationMessagesToErrorMessagesForPath,
  redirectToInputWithErrors,
} from '../../../middleware/validationMiddleware'

export default class ReviewDatesFromPreviousGenuineOverrideController implements Controller {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
    private readonly dateTypeConfigurationService: DateTypeConfigurationService,
  ) {}

  GET = async (req: Request<{ nomsId: string; calculationRequestId: string }>, res: Response): Promise<void> => {
    const { nomsId, calculationRequestId } = req.params
    const { caseloads, token, userRoles } = res.locals.user

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, token, caseloads, userRoles)
    const genuineOverrideInputs = genuineOverrideInputsForPrisoner(req, nomsId)
    sortDatesForGenuineOverride(genuineOverrideInputs.previousOverride.dates)
    const dateTypeDefinitions = await this.dateTypeConfigurationService.dateTypeToDescriptionMapping(
      token,
      'DESCRIPTION_ONLY',
    )
    return res.render(
      'pages/genuineOverrides/reviewDatesFromPreviousGenuineOverride',
      new ReviewDatesFromPreviousGenuineOverrideViewModel(
        prisonerDetail,
        genuineOverrideInputs.previousOverride.dates,
        dateTypeDefinitions,
        GenuineOverrideUrls.interceptForExpressOverride(nomsId, calculationRequestId),
        GenuineOverrideUrls.reviewDateFromPreviousOverride(nomsId, calculationRequestId),
      ),
    )
  }

  POST = async (
    req: Request<
      {
        nomsId: string
        calculationRequestId: string
      },
      unknown,
      ReviewDatesFromPreviousOverrideSummaryForm
    >,
    res: Response,
  ): Promise<void> => {
    const { nomsId, calculationRequestId } = req.params
    const { token, username } = res.locals.user
    const { stillCorrect } = req.body

    if (stillCorrect === 'YES') {
      const inputs = genuineOverrideInputsForPrisoner(req, nomsId)
      const request: GenuineOverrideRequest = {
        reason: inputs.previousOverride.reason as GenuineOverrideRequestReasonCode,
        reasonFurtherDetail: inputs.previousOverride.reasonFurtherDetail,
        dates: inputs.previousOverride.dates.map(date => ({
          dateType: date.type as ManualEntrySelectedDateType,
          date: date.date,
        })),
      }
      const response = await this.calculateReleaseDatesService.createGenuineOverrideForCalculation(
        username,
        nomsId,
        Number(calculationRequestId),
        token,
        request,
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
    return res.redirect(GenuineOverrideUrls.selectReasonForOverride(nomsId, calculationRequestId))
  }
}

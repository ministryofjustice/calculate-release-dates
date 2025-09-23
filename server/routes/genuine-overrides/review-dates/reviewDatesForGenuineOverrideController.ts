import { Request, Response } from 'express'
import { Controller } from '../../controller'
import GenuineOverrideUrls from '../genuineOverrideUrls'
import { genuineOverrideInputsForPrisoner, sortDatesForGenuineOverride } from '../genuineOverrideUtils'
import CalculateReleaseDatesService from '../../../services/calculateReleaseDatesService'
import PrisonerService from '../../../services/prisonerService'
import ReviewDatesForGenuineOverrideViewModel from '../../../models/genuine-override/ReviewDatesForGenuineOverrideViewModel'
import DateTypeConfigurationService from '../../../services/dateTypeConfigurationService'
import { filteredListOfDates } from '../../../views/pages/components/calculation-summary-dates-card/CalculationSummaryDatesCardModel'

export default class ReviewDatesForGenuineOverrideController implements Controller {
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

    if (!genuineOverrideInputs.dates) {
      const calculationResults = await this.calculateReleaseDatesService.getCalculationResults(
        Number(calculationRequestId),
        token,
      )
      genuineOverrideInputs.dates = []
      for (const [type, date] of Object.entries(calculationResults.dates)) {
        // exclude ESED and any other hidden date types.
        if (filteredListOfDates.indexOf(type) >= 0) {
          genuineOverrideInputs.dates.push({ type, date })
        }
      }
      sortDatesForGenuineOverride(genuineOverrideInputs.dates)
    }
    if (genuineOverrideInputs.dates?.length === 0) {
      return res.redirect(GenuineOverrideUrls.selectDatesToAdd(nomsId, calculationRequestId))
    }
    const dateTypeDefinitions = await this.dateTypeConfigurationService.dateTypeToDescriptionMapping(token)
    return res.render(
      'pages/genuineOverrides/reviewDatesForGenuineOverride',
      new ReviewDatesForGenuineOverrideViewModel(
        prisonerDetail,
        Number(calculationRequestId),
        genuineOverrideInputs.dates,
        dateTypeDefinitions,
        GenuineOverrideUrls.selectReasonForOverride(nomsId, calculationRequestId),
        GenuineOverrideUrls.reviewDatesForOverride(nomsId, calculationRequestId),
      ),
    )
  }

  POST = async (req: Request<{ nomsId: string; calculationRequestId: string }>, res: Response): Promise<void> => {
    const { nomsId, calculationRequestId } = req.params
    // TODO save
    return res.redirect(GenuineOverrideUrls.reviewDatesForOverride(nomsId, calculationRequestId))
  }
}

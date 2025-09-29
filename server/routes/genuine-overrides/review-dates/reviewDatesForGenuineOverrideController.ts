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

    if (!genuineOverrideInputs.datesToSave) {
      const calculationResults = await this.calculateReleaseDatesService.getCalculationResults(
        Number(calculationRequestId),
        token,
      )
      genuineOverrideInputs.datesToSave = []
      for (const [type, date] of Object.entries(calculationResults.dates)) {
        // exclude ESED and any other hidden date types.
        if (filteredListOfDates.indexOf(type) >= 0) {
          if (type === 'SLED') {
            // decompose SLED into SED and LED to allow users to override them to be different dates
            genuineOverrideInputs.datesToSave.push({ type: 'SED', date })
            genuineOverrideInputs.datesToSave.push({ type: 'LED', date })
          } else {
            genuineOverrideInputs.datesToSave.push({ type, date })
          }
        }
      }
    }
    if (genuineOverrideInputs.datesToSave?.length === 0) {
      return res.redirect(GenuineOverrideUrls.selectDatesToAdd(nomsId, calculationRequestId))
    }
    sortDatesForGenuineOverride(genuineOverrideInputs.datesToSave)
    const dateTypeDefinitions = await this.dateTypeConfigurationService.dateTypeToDescriptionMapping(
      token,
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
    // TODO save
    return res.redirect(GenuineOverrideUrls.reviewDatesForOverride(nomsId, calculationRequestId))
  }
}

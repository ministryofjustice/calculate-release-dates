import PrisonerContextViewModel from './PrisonerContextViewModel'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import CalculationSummaryViewModel from './CalculationSummaryViewModel'
import CalculationSummaryDatesCardModel from '../views/pages/components/calculation-summary-dates-card/CalculationSummaryDatesCardModel'
import ApprovedSummaryDatesCardModel from '../views/pages/components/approved-summary-dates-card/ApprovedSummaryDatesCardModel'

export default class GenuineOverridesCalculationSummaryPageViewModel extends PrisonerContextViewModel {
  constructor(
    prisonerDetail: PrisonApiPrisoner,
    public model: CalculationSummaryViewModel,
    public formError: boolean,
    public calculationReference: string,
    public calculationSummaryDatesCardModel: CalculationSummaryDatesCardModel,
    public approvedSummaryDatesCardModel: ApprovedSummaryDatesCardModel,
  ) {
    super(prisonerDetail)
  }
}

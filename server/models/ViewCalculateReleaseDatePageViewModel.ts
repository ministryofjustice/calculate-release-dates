import CalculationSummaryViewModel from './CalculationSummaryViewModel'
import OptionalPrisonerContextViewModel from './OptionalPrisonerContextViewModel'
import CalculationSummaryDatesCardModel from '../views/pages/components/calculation-summary-dates-card/CalculationSummaryDatesCardModel'
import ApprovedSummaryDatesCardModel from '../views/pages/components/approved-summary-dates-card/ApprovedSummaryDatesCardModel'

export default class ViewCalculateReleaseDatePageViewModel extends OptionalPrisonerContextViewModel {
  constructor(
    public model: CalculationSummaryViewModel,
    public calculationSummaryDatesCardModel: CalculationSummaryDatesCardModel,
    public approvedSummaryDatesCardModel: ApprovedSummaryDatesCardModel,
  ) {
    super(model.prisonerDetail)
  }
}

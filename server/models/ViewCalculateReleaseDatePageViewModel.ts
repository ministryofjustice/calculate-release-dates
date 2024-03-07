import CalculationSummaryViewModel from './CalculationSummaryViewModel'
import OptionalPrisonerContextViewModel from './OptionalPrisonerContextViewModel'
import CalculationSummaryDatesCardModel from '../views/pages/components/calculation-summary-dates-card/CalculationSummaryDatesCardModel'

export default class ViewCalculateReleaseDatePageViewModel extends OptionalPrisonerContextViewModel {
  constructor(
    public model: CalculationSummaryViewModel,
    public calculationSummaryDatesCardModel: CalculationSummaryDatesCardModel,
  ) {
    super(model.prisonerDetail)
  }
}

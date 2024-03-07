import PrisonerContextViewModel from './PrisonerContextViewModel'
import CalculationSummaryViewModel from './CalculationSummaryViewModel'
import CalculationSummaryDatesCardModel from '../views/pages/components/calculation-summary-dates-card/CalculationSummaryDatesCardModel'

export default class CalculationSummaryPageViewModel extends PrisonerContextViewModel {
  constructor(
    public model: CalculationSummaryViewModel,
    public calculationSummaryDatesCardModel: CalculationSummaryDatesCardModel,
  ) {
    super(model.prisonerDetail)
  }
}

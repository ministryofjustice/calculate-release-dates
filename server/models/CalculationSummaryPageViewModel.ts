import PrisonerContextViewModel from './PrisonerContextViewModel'
import CalculationSummaryViewModel from './CalculationSummaryViewModel'
import CalculationSummaryDatesCardModel from '../views/pages/components/calculation-summary-dates-card/CalculationSummaryDatesCardModel'
import ApprovedSummaryDatesCardModel from '../views/pages/components/approved-summary-dates-card/ApprovedSummaryDatesCardModel'

export default class CalculationSummaryPageViewModel extends PrisonerContextViewModel {
  constructor(
    public model: CalculationSummaryViewModel,
    public calculationSummaryDatesCardModel: CalculationSummaryDatesCardModel,
    public approvedSummaryDatesCardModel: ApprovedSummaryDatesCardModel,
    public isAddDatesFlow: boolean,
  ) {
    super(model.prisonerDetail)
  }
}

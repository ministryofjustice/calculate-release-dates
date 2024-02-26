import PrisonerContextViewModel from './PrisonerContextViewModel'
import CalculationSummaryViewModel from './CalculationSummaryViewModel'

export default class CalculationSummaryPageViewModel extends PrisonerContextViewModel {
  constructor(public model: CalculationSummaryViewModel) {
    super(model.prisonerDetail)
  }
}

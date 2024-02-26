import CalculationSummaryViewModel from './CalculationSummaryViewModel'
import OptionalPrisonerContextViewModel from './OptionalPrisonerContextViewModel'

export default class ViewCalculateReleaseDatePageViewModel extends OptionalPrisonerContextViewModel {
  constructor(public model: CalculationSummaryViewModel) {
    super(model.prisonerDetail)
  }
}

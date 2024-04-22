import OptionalPrisonerContextViewModel from './OptionalPrisonerContextViewModel'
import CalculationSummaryDatesCardModel from '../views/pages/components/calculation-summary-dates-card/CalculationSummaryDatesCardModel'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'

export default class ViewPastNomisCalculationPageViewModel extends OptionalPrisonerContextViewModel {
  constructor(
    prisonerDetail: PrisonApiPrisoner,
    public calculatedAt: string,
    public reason: string,
    public source: string,
    public calculationSummaryDatesCardModel?: CalculationSummaryDatesCardModel,
  ) {
    super(prisonerDetail)
  }
}

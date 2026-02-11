import { PrisonApiPrisoner } from '../../@types/prisonApi/prisonClientTypes'
import CalculationSummaryDatesCardModel from '../../views/pages/components/calculation-summary-dates-card/CalculationSummaryDatesCardModel'

export default class CalculationSummaryOverridesViewModel {
  constructor(
    public calculationRequestId: number,
    public nomsId: string,
    public prisonerDetail: PrisonApiPrisoner,
    public calculatedByDisplayName: string,
    public overrideReason: string,
    public crdsDates: CalculationSummaryDatesCardModel,
    public overrideDates: CalculationSummaryDatesCardModel,
  ) {
    // intentionally left blank
  }
}

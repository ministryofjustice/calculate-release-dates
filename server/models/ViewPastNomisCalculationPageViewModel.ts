import { Action, LatestCalculationCardConfig } from 'hmpps-court-cases-release-dates-design/hmpps/@types'
import CalculationSummaryViewModel from './CalculationSummaryViewModel'
import OptionalPrisonerContextViewModel from './OptionalPrisonerContextViewModel'
import CalculationSummaryDatesCardModel from '../views/pages/components/calculation-summary-dates-card/CalculationSummaryDatesCardModel'
import ApprovedSummaryDatesCardModel from '../views/pages/components/approved-summary-dates-card/ApprovedSummaryDatesCardModel'
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

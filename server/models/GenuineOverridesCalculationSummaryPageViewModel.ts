import PrisonerContextViewModel from './PrisonerContextViewModel'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import CalculationSummaryViewModel from './CalculationSummaryViewModel'

export default class GenuineOverridesCalculationSummaryPageViewModel extends PrisonerContextViewModel {
  constructor(
    prisonerDetail: PrisonApiPrisoner,
    public model: CalculationSummaryViewModel,
    public formError: boolean,
    public calculationReference: string,
  ) {
    super(prisonerDetail)
  }
}

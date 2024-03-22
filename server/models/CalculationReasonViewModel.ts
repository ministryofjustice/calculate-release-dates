import PrisonerContextViewModel from './PrisonerContextViewModel'
import { CalculationReason } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'

export default class CalculationReasonViewModel extends PrisonerContextViewModel {
  constructor(
    prisonerDetail: PrisonApiPrisoner,
    public reasons: CalculationReason[],
    public dpsEntryPoint: boolean,
    public errorMessage?: { text: string },
    public otherErrorMessage?: { text: string; id: number },
  ) {
    super(prisonerDetail)
    this.reasons = reasons
  }
}

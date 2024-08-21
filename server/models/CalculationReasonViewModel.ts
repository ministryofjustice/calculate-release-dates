import PrisonerContextViewModel from './PrisonerContextViewModel'
import { CalculationReason } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'

export default class CalculationReasonViewModel extends PrisonerContextViewModel {
  constructor(
    prisonerDetail: PrisonApiPrisoner,
    public reasons: CalculationReason[],
    public errorMessage?: { text: string },
    public otherErrorMessage?: { text: string; id: number; otherText?: string },
    public pageCancelRedirectUrl?: string,
  ) {
    super(prisonerDetail)
    this.reasons = reasons
  }
}

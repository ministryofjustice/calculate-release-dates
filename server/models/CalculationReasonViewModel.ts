import PrisonerContextViewModel from './PrisonerContextViewModel'
import { CalculationReason } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'

export default class CalculationReasonViewModel extends PrisonerContextViewModel {
  protected reasons: CalculationReason[]

  constructor(prisonerDetail: PrisonApiPrisoner, reasons: CalculationReason[]) {
    super(prisonerDetail)
    this.reasons = reasons
  }
}

import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import CommonLayoutViewModel from './CommonLayoutViewModel'

export default abstract class OptionalPrisonerContextViewModel extends CommonLayoutViewModel {
  protected prisonerDetail?: PrisonApiPrisoner

  protected constructor(prisonerDetail?: PrisonApiPrisoner) {
    super(prisonerDetail)
    this.prisonerDetail = prisonerDetail
  }
}

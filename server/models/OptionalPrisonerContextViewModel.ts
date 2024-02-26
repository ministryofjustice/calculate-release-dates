import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'

export default abstract class OptionalPrisonerContextViewModel {
  protected prisonerDetail?: PrisonApiPrisoner

  protected constructor(prisonerDetail?: PrisonApiPrisoner) {
    this.prisonerDetail = prisonerDetail
  }
}

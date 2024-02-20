import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'

export default abstract class PrisonerContextViewModel {
  protected prisonerDetail: PrisonApiPrisoner

  protected constructor(prisonerDetail: PrisonApiPrisoner) {
    this.prisonerDetail = prisonerDetail
  }
}

import PrisonerContextViewModel from '../PrisonerContextViewModel'
import { PrisonApiPrisoner } from '../../@types/prisonApi/prisonClientTypes'

export default class GenuineOverridesLoadReasonsViewModel extends PrisonerContextViewModel {
  constructor(
    prisonerDetail: PrisonApiPrisoner,
    public noRadio: boolean,
    public noOtherReason: boolean,
    public calculationReference: string,
  ) {
    super(prisonerDetail)
  }
}

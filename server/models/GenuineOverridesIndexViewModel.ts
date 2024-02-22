import OptionalPrisonerContextViewModel from './OptionalPrisonerContextViewModel'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'

export default class GenuineOverridesIndexViewModel extends OptionalPrisonerContextViewModel {
  constructor(
    public calculationReference: string,
    prisonerDetail?: PrisonApiPrisoner,
  ) {
    super(prisonerDetail)
  }
}

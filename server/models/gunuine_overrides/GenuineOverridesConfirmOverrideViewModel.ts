import PrisonerContextViewModel from '../PrisonerContextViewModel'
import { PrisonApiPrisoner } from '../../@types/prisonApi/prisonClientTypes'

export default class GenuineOverridesConfirmOverrideViewModel extends PrisonerContextViewModel {
  constructor(
    prisonerDetail: PrisonApiPrisoner,
    public rows: unknown,
    public calculationReference: string,
  ) {
    super(prisonerDetail)
  }
}

import PrisonerContextViewModel from '../PrisonerContextViewModel'
import { PrisonApiPrisoner } from '../../@types/prisonApi/prisonClientTypes'

export default class GenuineOverridesRequestSupportViewModel extends PrisonerContextViewModel {
  constructor(
    prisonerDetail: PrisonApiPrisoner,
    public calculationReference: string,
    public calculationRequestId: number,
  ) {
    super(prisonerDetail)
  }
}

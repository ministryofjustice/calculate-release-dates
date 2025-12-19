import PrisonerContextViewModel from '../PrisonerContextViewModel'
import { PrisonApiPrisoner } from '../../@types/prisonApi/prisonClientTypes'

export default class ApprovedDeleteDateViewModel extends PrisonerContextViewModel {
  constructor(
    prisonerDetail: PrisonApiPrisoner,
    public description: string,
    public pageCancelRedirectUrl: string,
  ) {
    super(prisonerDetail)
  }
}

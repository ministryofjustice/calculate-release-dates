import PrisonerContextViewModel from '../PrisonerContextViewModel'
import { PrisonApiPrisoner } from '../../@types/prisonApi/prisonClientTypes'

export default class GenuineOverrideExpressInterceptViewModel extends PrisonerContextViewModel {
  constructor(
    prisonerDetail: PrisonApiPrisoner,
    public reason: string,
    public backLink: string,
    public pageCancelRedirectUrl: string,
  ) {
    super(prisonerDetail)
  }
}

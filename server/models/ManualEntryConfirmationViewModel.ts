import PrisonerContextViewModel from './PrisonerContextViewModel'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'

export default class ManualEntryConfirmationViewModel extends PrisonerContextViewModel {
  constructor(
    prisonerDetail: PrisonApiPrisoner,
    public rows: unknown,
    public pageCancelRedirectUrl?: string,
  ) {
    super(prisonerDetail)
  }
}

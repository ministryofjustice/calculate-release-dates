import PrisonerContextViewModel from './PrisonerContextViewModel'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'

export default class ManualEntryNoDatesConfirmationViewModel extends PrisonerContextViewModel {
  constructor(
    prisonerDetail: PrisonApiPrisoner,
    public redirectUrl?: string,
    public error?: boolean,
  ) {
    super(prisonerDetail)
  }
}

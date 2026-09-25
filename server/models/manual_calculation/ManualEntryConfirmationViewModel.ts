import PrisonerContextViewModel from '../PrisonerContextViewModel'
import { PrisonApiPrisoner } from '../../@types/prisonApi/prisonClientTypes'
import { ErrorMessages } from '../../types/ErrorMessages'

export default class ManualEntryConfirmationViewModel extends PrisonerContextViewModel {
  constructor(
    prisonerDetail: PrisonApiPrisoner,
    public rows: unknown,
    public pageCancelRedirectUrl?: string,
    public existingCalculation: boolean = false,
    public confirmationError: boolean = false,
    public differentDatesConfirmed?: boolean,
    public systemErrors?: ErrorMessages,
  ) {
    super(prisonerDetail)
  }
}

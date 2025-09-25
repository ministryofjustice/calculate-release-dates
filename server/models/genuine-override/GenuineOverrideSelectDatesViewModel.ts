import PrisonerContextViewModel from '../PrisonerContextViewModel'
import { PrisonApiPrisoner } from '../../@types/prisonApi/prisonClientTypes'
import { SelectedDateCheckBox } from '../../services/manualEntryService'

export default class GenuineOverrideSelectDatesViewModel extends PrisonerContextViewModel {
  constructor(
    prisonerDetail: PrisonApiPrisoner,
    public checkboxes: SelectedDateCheckBox[],
    public backLink: string,
    public pageCancelRedirectUrl: string,
  ) {
    super(prisonerDetail)
  }
}

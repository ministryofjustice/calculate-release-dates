import PrisonerContextViewModel from '../PrisonerContextViewModel'
import SentenceAndOffenceViewModel from '../SentenceAndOffenceViewModel'

export default class ManualEntryCheckInformationUnsupportedViewModel extends PrisonerContextViewModel {
  constructor(
    public model: SentenceAndOffenceViewModel,
    public pageCancelRedirectUrl?: string,
  ) {
    super(model.prisonerDetail)
  }
}

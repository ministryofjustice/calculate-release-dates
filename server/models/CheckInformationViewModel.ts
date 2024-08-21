import PrisonerContextViewModel from './PrisonerContextViewModel'
import SentenceAndOffenceViewModel from './SentenceAndOffenceViewModel'

export default class CheckInformationViewModel extends PrisonerContextViewModel {
  constructor(
    public model: SentenceAndOffenceViewModel,
    public displayNoOfOffenceCount: boolean,
    public pageCancelRedirectUrl?: string,
  ) {
    super(model.prisonerDetail)
  }
}

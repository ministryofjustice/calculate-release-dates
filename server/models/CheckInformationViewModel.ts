import PrisonerContextViewModel from './PrisonerContextViewModel'
import SentenceAndOffenceViewModel from './SentenceAndOffenceViewModel'

export default class CheckInformationViewModel extends PrisonerContextViewModel {
  constructor(public model: SentenceAndOffenceViewModel) {
    super(model.prisonerDetail)
  }
}

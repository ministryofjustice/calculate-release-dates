import PrisonerContextViewModel from './PrisonerContextViewModel'
import ViewRouteSentenceAndOffenceViewModel from './ViewRouteSentenceAndOffenceViewModel'

export default class SentenceAndOffencePageViewModel extends PrisonerContextViewModel {
  constructor(
    public model: ViewRouteSentenceAndOffenceViewModel,
    public calculationRequestId: number,
    public nomsId: string,
  ) {
    super(model.prisonerDetail)
  }
}

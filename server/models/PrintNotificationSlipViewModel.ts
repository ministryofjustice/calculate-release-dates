import PrisonerContextViewModel from './PrisonerContextViewModel'
import ViewRouteSentenceAndOffenceViewModel from './ViewRouteSentenceAndOffenceViewModel'

export default class PrintNotificationSlipViewModel extends PrisonerContextViewModel {
  constructor(
    public model: ViewRouteSentenceAndOffenceViewModel,
    public calculationRequestId: number,
    public nomsId: string,
    public calculationDate: string,
    public keyDatesArray: { date: string; description: string }[],
    public fromPage: string,
    public pageType: string,
    public calculationReason: string,
  ) {
    super(model.prisonerDetail)
  }
}

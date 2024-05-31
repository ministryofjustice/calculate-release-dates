import PrisonerContextViewModel from './PrisonerContextViewModel'
import ViewRouteSentenceAndOffenceViewModel from './ViewRouteSentenceAndOffenceViewModel'

export default class PrintNotificationSlipViewModel extends PrisonerContextViewModel {
  public hasHDCED: boolean

  constructor(
    public model: ViewRouteSentenceAndOffenceViewModel,
    public calculationRequestId: number,
    public nomsId: string,
    public calculationDate: string,
    public keyDatesArray: { code: string; date: string; description: string }[],
    public fromPage: string,
    public pageType: string,
    public calculationReason: string,
  ) {
    super(model.prisonerDetail)
    this.hasHDCED = this.hasHDCEDInReleaseDates()
  }

  hasHDCEDInReleaseDates(): boolean {
    return this.keyDatesArray.some(keyDate => keyDate.code === 'HDCED')
  }
}

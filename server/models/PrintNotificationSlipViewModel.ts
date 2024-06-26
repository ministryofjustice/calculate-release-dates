import PrisonerContextViewModel from './PrisonerContextViewModel'
import ViewRouteSentenceAndOffenceViewModel from './ViewRouteSentenceAndOffenceViewModel'
import KeyDate from './KeyDate'

export default class PrintNotificationSlipViewModel extends PrisonerContextViewModel {
  public hasHDCED: boolean

  public nonDtoKeyDates: KeyDate[]

  public dtoKeyDates: KeyDate[]

  constructor(
    public model: ViewRouteSentenceAndOffenceViewModel,
    public calculationRequestId: number,
    public nomsId: string,
    public calculationDate: string,
    public keyDatesArray: KeyDate[],
    public fromPage: string,
    public pageType: string,
    public calculationReason: string,
    public hasDTOSentence: boolean,
    public hasOnlyDTOSentences: boolean,
  ) {
    super(model.prisonerDetail)
    this.hasHDCED = this.hasHDCEDInReleaseDates()
    this.nonDtoKeyDates = this.getNonDTOKeyDatesInOrder()
    this.dtoKeyDates = this.getDTOKeyDatesInOrder()
  }

  hasHDCEDInReleaseDates(): boolean {
    return this.keyDatesArray.some(keyDate => keyDate.code === 'HDCED')
  }

  getNonDTOKeyDatesInOrder(): { code: string; date: string; description: string }[] {
    const codes = ['SED', 'LED', 'SLED', 'HDCED', 'HDCAD', 'PED', 'ERSED', 'TUSED', 'ROTL']
    const keyDates: KeyDate[] = codes
      .map(code => this.keyDatesArray.find(keyDate => keyDate.code === code))
      .filter(Boolean)
    const getSubsetDate = this.getNonDTOSubsetOfDaysInOrder()

    if (getSubsetDate !== undefined) {
      const codesToFind = ['SLED', 'LED', 'SED']
      const foundCode = codesToFind.find(code => keyDates.some(element => element.code === code))
      const index = foundCode ? keyDates.findIndex(element => element.code === foundCode) : -1
      keyDates.splice(index + 1, 0, getSubsetDate)
    }

    return keyDates
  }

  getNonDTOSubsetOfDaysInOrder(): KeyDate {
    const codes = ['ARD', 'CRD', 'NPD', 'PRRD']
    function getLatestDate(sortedKeyDates: KeyDate[]): string {
      const latestDate: KeyDate = sortedKeyDates.reduce((latest, current) => {
        return new Date(latest.date) > new Date(current.date) ? latest : current
      })
      return latestDate.date
    }
    const sortedKeyDates: KeyDate[] = codes
      .map(code => this.keyDatesArray.find(keyDate => keyDate.code === code))
      .filter(Boolean)

    if (sortedKeyDates.length === 0) {
      return undefined
    }

    const latestDate = getLatestDate(sortedKeyDates)
    const latestDates = sortedKeyDates.filter(keyDate => keyDate.date === latestDate)
    return latestDates[0]
  }

  getDTOKeyDatesInOrder() {
    const codes = ['SED', 'ETD', 'MTD', 'LTD', 'TUSED']
    const keyDates: KeyDate[] = codes
      .map(code => this.keyDatesArray.find(keyDate => keyDate.code === code))
      .filter(Boolean)

    return keyDates
  }
}

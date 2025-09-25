import dayjs from 'dayjs'
import PrisonerContextViewModel from '../PrisonerContextViewModel'
import { PrisonApiPrisoner } from '../../@types/prisonApi/prisonClientTypes'
import GenuineOverrideUrls from '../../routes/genuine-overrides/genuineOverrideUrls'
import { EnteredGenuineOverrideDate } from './genuineOverrideInputs'

export default class ReviewDatesForGenuineOverrideViewModel extends PrisonerContextViewModel {
  public dateRows: {
    key: { text: string }
    value: { text: string }
    actions?: { items: { text: string; href: string }[] }
  }[]

  public addLink: string

  constructor(
    prisonerDetail: PrisonApiPrisoner,
    calculationRequestId: number,
    dates: EnteredGenuineOverrideDate[],
    dateTypeDefinitions: { [p: string]: string },
    public backLink: string,
    public pageCancelRedirectUrl: string,
  ) {
    super(prisonerDetail)
    this.addLink = GenuineOverrideUrls.selectDatesToAdd(prisonerDetail.offenderNo, calculationRequestId)
    this.dateRows = dates.map(date => {
      return {
        key: { text: dateTypeDefinitions[date.type] },
        value: { text: this.formatDate(date) },
        actions: {
          items: [
            {
              text: 'Edit',
              href: GenuineOverrideUrls.overrideDate(prisonerDetail.offenderNo, calculationRequestId, date.type),
            },
            {
              text: 'Delete',
              href: GenuineOverrideUrls.deleteDate(prisonerDetail.offenderNo, calculationRequestId, date.type),
            },
          ],
        },
      }
    })
  }

  private formatDate(date: EnteredGenuineOverrideDate) {
    if (date.type === 'None') {
      return ''
    }
    return dayjs(date.date).format('DD MMMM YYYY')
  }
}

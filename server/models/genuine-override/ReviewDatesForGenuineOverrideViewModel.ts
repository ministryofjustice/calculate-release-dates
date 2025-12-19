import dayjs from 'dayjs'
import PrisonerContextViewModel from '../PrisonerContextViewModel'
import { PrisonApiPrisoner } from '../../@types/prisonApi/prisonClientTypes'
import GenuineOverrideUrls from '../../routes/genuine-overrides/genuineOverrideUrls'

import { EnteredDate } from '../../@types/journeys'

export default class ReviewDatesForGenuineOverrideViewModel extends PrisonerContextViewModel {
  public dateRows: {
    key: { html: string }
    value: { text: string; classes: string }
    actions?: { items: { text: string; href: string; attributes?: { 'data-qa': string } }[] }
  }[]

  public addLink: string

  constructor(
    prisonerDetail: PrisonApiPrisoner,
    calculationRequestId: number,
    dates: EnteredDate[],
    dateTypeDefinitions: { [p: string]: string },
    public backLink: string,
    public pageCancelRedirectUrl: string,
  ) {
    super(prisonerDetail)
    this.addLink = GenuineOverrideUrls.selectDatesToAdd(prisonerDetail.offenderNo, calculationRequestId)
    this.dateRows = dates.map(date => {
      return {
        key: {
          html: `<span class="govuk-!-font-size-24">${date.type}</span><br/><span class="govuk-hint">${dateTypeDefinitions[date.type]}</span>`,
        },
        value: { text: this.formatDate(date), classes: `${date.type}-date-value` },
        actions: {
          items: [
            {
              text: 'Edit',
              href: GenuineOverrideUrls.editDate(prisonerDetail.offenderNo, calculationRequestId, date.type),
              attributes: { 'data-qa': `edit-${date.type}-link` },
            },
            {
              text: 'Delete',
              href: GenuineOverrideUrls.deleteDate(prisonerDetail.offenderNo, calculationRequestId, date.type),
              attributes: { 'data-qa': `delete-${date.type}-link` },
            },
          ],
        },
      }
    })
  }

  private formatDate(date: EnteredDate) {
    if (date.type === 'None') {
      return ''
    }
    return dayjs(date.date).format('DD MMMM YYYY')
  }
}

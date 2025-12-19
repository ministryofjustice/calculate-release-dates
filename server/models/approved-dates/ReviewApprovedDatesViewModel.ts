import dayjs from 'dayjs'
import PrisonerContextViewModel from '../PrisonerContextViewModel'
import { PrisonApiPrisoner } from '../../@types/prisonApi/prisonClientTypes'

import { EnteredDate } from '../../@types/journeys'
import ApprovedDatesUrls from '../../routes/approved-dates/approvedDateUrls'

export default class ReviewApprovedDatesViewModel extends PrisonerContextViewModel {
  public dateRows: {
    key: { html: string }
    value: { text: string; classes: string }
    actions?: { items: { text: string; href: string; attributes?: { 'data-qa': string } }[] }
  }[]

  constructor(
    prisonerDetail: PrisonApiPrisoner,
    journeyId: string,
    dates: EnteredDate[],
    dateTypeDefinitions: { [p: string]: string },
    public addLink: string,
    public backLink: string,
    public pageCancelRedirectUrl: string,
  ) {
    super(prisonerDetail)
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
              href: ApprovedDatesUrls.editDate(prisonerDetail.offenderNo, journeyId, date.type),
              attributes: { 'data-qa': `edit-${date.type}-link` },
            },
            {
              text: 'Delete',
              href: ApprovedDatesUrls.deleteDate(prisonerDetail.offenderNo, journeyId, date.type),
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

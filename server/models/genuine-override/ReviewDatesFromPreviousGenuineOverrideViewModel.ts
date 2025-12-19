import dayjs from 'dayjs'
import PrisonerContextViewModel from '../PrisonerContextViewModel'
import { PrisonApiPrisoner } from '../../@types/prisonApi/prisonClientTypes'

import { EnteredDate } from '../../@types/journeys'

export default class ReviewDatesFromPreviousGenuineOverrideViewModel extends PrisonerContextViewModel {
  public dateRows: {
    key: { html: string }
    value: { text: string; classes: string }
  }[]

  constructor(
    prisonerDetail: PrisonApiPrisoner,
    dates: EnteredDate[],
    dateTypeDefinitions: { [p: string]: string },
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

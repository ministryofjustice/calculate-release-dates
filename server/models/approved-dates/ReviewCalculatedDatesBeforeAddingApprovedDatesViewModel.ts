import dayjs from 'dayjs'
import PrisonerContextViewModel from '../PrisonerContextViewModel'
import { PrisonApiPrisoner } from '../../@types/prisonApi/prisonClientTypes'
import { DetailedCalculationResults } from '../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { filteredListOfDates } from '../../views/pages/components/calculation-summary-dates-card/CalculationSummaryDatesCardModel'

export default class ReviewCalculatedDatesBeforeAddingApprovedDatesViewModel extends PrisonerContextViewModel {
  public dateRows: {
    key: { html: string; classes: string }
    value: { text: string; classes: string }
  }[]

  constructor(
    prisonerDetail: PrisonApiPrisoner,
    detailedCalculationResults: DetailedCalculationResults,
    public backLink: string,
    public pageCancelRedirectUrl: string,
  ) {
    super(prisonerDetail)
    this.dateRows = Object.values(detailedCalculationResults.dates)
      .filter(dateObject => dateObject && dateObject.date && filteredListOfDates.includes(dateObject.type))
      .sort((a, b) => filteredListOfDates.indexOf(a.type) - filteredListOfDates.indexOf(b.type))
      .map(dateObject => ({
        key: {
          html: `<span class="govuk-!-font-size-24">${dateObject.type}</span><br/><span class="govuk-hint">${dateObject.description}</span>`,
          classes: 'govuk-!-width-one-half',
        },
        value: {
          text: this.formatDate(dateObject.date),
          classes: `${dateObject.type}-date-value govuk-!-width-one-half`,
        },
      }))
  }

  private formatDate(date: string) {
    return dayjs(date).format('DD MMMM YYYY')
  }
}

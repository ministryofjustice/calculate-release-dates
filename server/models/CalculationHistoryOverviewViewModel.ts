import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import PrisonerContextViewModel from './PrisonerContextViewModel'
import {
  HistoricCalculationSummaryPage,
  SecondCheckDetails,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { CalculationSummaryDatesPanelModel } from '../views/pages/components/calculation-summary-dates-card/CalculationSummaryDatesCardModel'

type PageItems = { from: number; to: number }

export default class CalculationHistoryOverviewViewModel extends PrisonerContextViewModel {
  public thisPageItems: PageItems

  public previousPageItems: PageItems

  public nextPageItems: PageItems

  constructor(
    public prisonerDetail: PrisonApiPrisoner,
    public selectedCalculationSource: string,
    public selectedCalculationId: number,
    public calculationDate: string,
    public calculationReason: string,
    public calculationReasonFurtherDetail: string | null,
    public calculatedByDisplayName: string,
    public establishmentCalculatedAtDescription: string,
    public secondCheckDetails: SecondCheckDetails | null,
    public history: HistoricCalculationSummaryPage,
    public pageSize: number,
    public calculationSummaryDatesPanelModel: CalculationSummaryDatesPanelModel,
    public courtCaseCount: number | null,
    public sentenceCount: number | null,
    public adjustmentTypes: string[],
  ) {
    super(prisonerDetail)
    const thisPageFrom = (history.page.pageNumber - 1) * pageSize + 1
    this.thisPageItems = {
      from: thisPageFrom,
      to: thisPageFrom + history.items.length - 1,
    }
    if (history.page.pageNumber > 1) {
      this.previousPageItems = {
        from: thisPageFrom - pageSize,
        to: thisPageFrom - 1,
      }
    }
    if (history.page.pageNumber < history.page.totalPages) {
      const nextPageTo = thisPageFrom + pageSize + pageSize - 1
      this.nextPageItems = {
        from: thisPageFrom + pageSize,
        to: nextPageTo < history.page.totalItems ? nextPageTo : history.page.totalItems,
      }
    }
  }
}

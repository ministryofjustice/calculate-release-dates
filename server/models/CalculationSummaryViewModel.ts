import dayjs from 'dayjs'
import { CalculationBreakdown, WorkingDay } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ReleaseDateWithAdjustments from '../@types/calculateReleaseDates/releaseDateWithAdjustments'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { ErrorMessages } from '../types/ErrorMessages'

// TODO refactor this so that the view model is passed to nunjucks as render(..., { viewModel: CalculationSummaryViewModel }).
// Just passing render(..., CalculationSummaryViewModel) means that class functions arent availble and the scope of the function call
// is modified by nunjucks.
export default class CalculationSummaryViewModel {
  public hdcedBeforePRRD = function hdcedBeforePRRD(
    releaseDates: { [key: string]: string },
    calculationBreakdown?: CalculationBreakdown,
  ): boolean {
    if (releaseDates?.HDCED && calculationBreakdown?.otherDates?.PRRD) {
      const hdced = dayjs(releaseDates?.HDCED)
      const prrd = dayjs(calculationBreakdown.otherDates.PRRD)
      if (prrd > hdced) {
        return true
      }
    }
    return false
  }

  public showBreakdown = function showBreakdown(
    releaseDates: { [key: string]: string },
    calculationBreakdown?: CalculationBreakdown,
  ): boolean {
    return !!calculationBreakdown && !releaseDates.PRRD && !calculationBreakdown?.otherDates?.PRRD
  }

  constructor(
    public releaseDates: { [key: string]: string },
    public weekendAdjustments: { [key: string]: WorkingDay },
    public calculationRequestId: number,
    public nomsId: string,
    public prisonerDetail: PrisonApiPrisoner,
    public calculationBreakdown?: CalculationBreakdown,
    public releaseDatesWithAdjustments?: ReleaseDateWithAdjustments[],
    public validationErrors?: ErrorMessages,
    public calculationSummaryUnavailable?: boolean,
  ) {}
}

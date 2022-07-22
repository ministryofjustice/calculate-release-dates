import dayjs from 'dayjs'
import {
  CalculationBreakdown,
  SentenceDiagram,
  WorkingDay,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ReleaseDateWithAdjustments from '../@types/calculateReleaseDates/releaseDateWithAdjustments'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { ErrorMessages } from '../types/ErrorMessages'
import SentenceDiagramViewModel from './SentenceDiagramViewModel'

export default class CalculationSummaryViewModel {
  public sentenceDiagramViewModel?: SentenceDiagramViewModel

  constructor(
    public releaseDates: { [key: string]: string },
    public weekendAdjustments: { [key: string]: WorkingDay },
    public calculationRequestId: number,
    public nomsId: string,
    public prisonerDetail: PrisonApiPrisoner,
    public calculationBreakdown?: CalculationBreakdown,
    public releaseDatesWithAdjustments?: ReleaseDateWithAdjustments[],
    sentenceDiagram?: SentenceDiagram,
    public validationErrors?: ErrorMessages,
    public calculationSummaryUnavailable?: boolean,
    public dpsEntryPoint?: boolean
  ) {
    if (sentenceDiagram) {
      this.sentenceDiagramViewModel = new SentenceDiagramViewModel(sentenceDiagram)
    }
  }

  public hdcedBeforePRRD(): boolean {
    if (this.releaseDates?.HDCED && this.calculationBreakdown?.otherDates?.PRRD) {
      const hdced = dayjs(this.releaseDates?.HDCED)
      const prrd = dayjs(this.calculationBreakdown.otherDates.PRRD)
      if (prrd > hdced) {
        return true
      }
    }
    return false
  }

  public showBreakdown(): boolean {
    return !!this.calculationBreakdown && !this.releaseDates.PRRD && !this.calculationBreakdown?.otherDates?.PRRD
  }
}

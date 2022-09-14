import dayjs from 'dayjs'
import {
  CalculationBreakdown,
  SentenceDiagram,
  WorkingDay,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ReleaseDateWithAdjustments from '../@types/calculateReleaseDates/releaseDateWithAdjustments'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/PrisonApiOffenderSentenceAndOffences'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { ErrorMessages } from '../types/ErrorMessages'
import SentenceDiagramViewModel from './SentenceDiagramViewModel'
import SentenceTypes from './SentenceTypes'

export default class CalculationSummaryViewModel {
  public sentenceDiagramViewModel?: SentenceDiagramViewModel

  constructor(
    public releaseDates: { [key: string]: string },
    public weekendAdjustments: { [key: string]: WorkingDay },
    public calculationRequestId: number,
    public nomsId: string,
    public prisonerDetail: PrisonApiPrisoner,
    public sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
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

  public pedBeforePRRD(): boolean {
    if (this.releaseDates?.PED && this.calculationBreakdown?.otherDates?.PRRD) {
      const ped = dayjs(this.releaseDates?.PED)
      const prrd = dayjs(this.calculationBreakdown.otherDates.PRRD)
      if (prrd > ped) {
        return true
      }
    }
    return false
  }

  public displayPedAdjustmentHint(): boolean {
    if (this.releaseDates?.PED && this.calculationBreakdown?.breakdownByReleaseDateType?.PED) {
      const { rules } = this.calculationBreakdown.breakdownByReleaseDateType.PED
      if (rules.includes('PED_EQUAL_TO_LATEST_NON_PED_RELEASE')) {
        return true
      }
    }
    return false
  }

  public showBreakdown(): boolean {
    return (
      !!this.calculationBreakdown &&
      !this.releaseDates.PRRD &&
      !this.calculationBreakdown?.otherDates?.PRRD &&
      this.allSentencesSupported()
    )
  }

  private allSentencesSupported(): boolean {
    return !this.sentencesAndOffences.find(
      sentence => SentenceTypes.isSentenceEds(sentence) || SentenceTypes.isSentenceSopc(sentence)
    )
  }
}

import dayjs from 'dayjs'
import { CalculationBreakdown, WorkingDay } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ReleaseDateWithAdjustments from '../@types/calculateReleaseDates/releaseDateWithAdjustments'
import { PrisonApiOffenderSentenceAndOffences, PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { ErrorMessages } from '../types/ErrorMessages'
import SentenceTypes from './SentenceTypes'

export default class CalculationSummaryViewModel {
  constructor(
    public releaseDates: { [key: string]: string },
    public weekendAdjustments: { [key: string]: WorkingDay },
    public calculationRequestId: number,
    public nomsId: string,
    public prisonerDetail: PrisonApiPrisoner,
    public sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
    public calculationBreakdown?: CalculationBreakdown,
    public releaseDatesWithAdjustments?: ReleaseDateWithAdjustments[],
    public validationErrors?: ErrorMessages,
    public calculationSummaryUnavailable?: boolean,
    public dpsEntryPoint?: boolean
  ) {}

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

  public displayPedAdjustmentHint(): string {
    if (this.releaseDates?.PED && this.calculationBreakdown?.breakdownByReleaseDateType?.PED) {
      const { rules } = this.calculationBreakdown.breakdownByReleaseDateType.PED
      if (rules.includes('PED_EQUAL_TO_LATEST_NON_PED_CONDITIONAL_RELEASE')) {
        return 'CRD'
      }
      if (rules.includes('PED_EQUAL_TO_LATEST_NON_PED_ACTUAL_RELEASE')) {
        return 'ARD'
      }
    }
    return null
  }

  public displayHdcedAdjustmentHint(): string {
    if (this.releaseDates?.HDCED && this.calculationBreakdown?.breakdownByReleaseDateType?.HDCED) {
      const { rules } = this.calculationBreakdown.breakdownByReleaseDateType.HDCED
      if (rules.includes('HDCED_ADJUSTED_TO_CONCURRENT_CONDITIONAL_RELEASE')) {
        return 'CRD'
      }
      if (rules.includes('HDCED_ADJUSTED_TO_CONCURRENT_ACTUAL_RELEASE')) {
        return 'ARD'
      }
    }
    return null
  }

  public displayErsedAdjustmentHint(): boolean {
    if (this.releaseDates?.ERSED && this.calculationBreakdown?.breakdownByReleaseDateType?.ERSED) {
      const { rules } = this.calculationBreakdown.breakdownByReleaseDateType.ERSED
      if (rules.includes('ERSED_ADJUSTED_TO_CONCURRENT_TERM')) {
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
    return !this.sentencesAndOffences.find(sentence => !SentenceTypes.isSentenceSds(sentence))
  }

  public isErsedElligible(): boolean {
    return !!this.sentencesAndOffences?.find(sentence => SentenceTypes.isSentenceErsedElligible(sentence))
  }

  public isRecallOnly(): boolean {
    return this.sentencesAndOffences?.every(sentence => SentenceTypes.isRecall(sentence))
  }
}

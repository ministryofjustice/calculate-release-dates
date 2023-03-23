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
    return this.sentencesAndOffences?.some(sentence => SentenceTypes.isSentenceErsedElligible(sentence))
  }

  public isRecallOnly(): boolean {
    return this.sentencesAndOffences?.every(sentence => SentenceTypes.isRecall(sentence))
  }

  public hasConcurrentDtoAndCrdArdSentence(): boolean {
    return (
      this.sentencesAndOffences?.some(sentence => SentenceTypes.isSentenceDto(sentence)) &&
      this.sentencesAndOffences?.some(sentence => !SentenceTypes.isSentenceDto(sentence))
    )
  }

  private dateBeforeAnother(dateA: string, dateB: string): boolean {
    if (dateA && dateB) {
      const dayjsDateA = dayjs(dateA)
      const dayjsDateB = dayjs(dateB)
      return dayjsDateA < dayjsDateB
    }
    return false
  }

  private displayDateBeforeMtd(date: string): boolean {
    if (this.hasConcurrentDtoAndCrdArdSentence()) {
      return this.dateBeforeAnother(date, this.releaseDates?.MTD)
    }
    return false
  }

  public displayCrdBeforeMtd(): boolean {
    return this.displayDateBeforeMtd(this.releaseDates?.CRD)
  }

  public displayArdBeforeMtd(): boolean {
    return this.displayDateBeforeMtd(this.releaseDates?.ARD)
  }

  public displayPedBeforeMtd(): boolean {
    return this.displayDateBeforeMtd(this.releaseDates?.PED)
  }

  public displayHdcedBeforeMtd(): boolean {
    return this.displayDateBeforeMtd(this.releaseDates?.HDCED)
  }

  public mtdHintText(): string {
    const displayHdcedBeforeMtd = this.displayHdcedBeforeMtd()
    const pedBeforeMtd = this.displayPedBeforeMtd()
    const mtdBeforeCrd = this.dateBeforeAnother(this.releaseDates?.MTD, this.releaseDates?.CRD)
    const mtdBeforeArd = this.dateBeforeAnother(this.releaseDates?.MTD, this.releaseDates?.ARD)
    const mtdBeforeHdced = this.dateBeforeAnother(this.releaseDates?.MTD, this.releaseDates?.HDCED)
    const hdcedBeforeCrd = this.dateBeforeAnother(this.releaseDates?.HDCED, this.releaseDates?.CRD)
    const hdcedBeforeArd = this.dateBeforeAnother(this.releaseDates?.HDCED, this.releaseDates?.ARD)
    const mtdBeforePed = this.dateBeforeAnother(this.releaseDates?.MTD, this.releaseDates?.PED)
    const pedBeforeCrd = this.dateBeforeAnother(this.releaseDates?.PED, this.releaseDates?.CRD)
    if (this.hasConcurrentDtoAndCrdArdSentence()) {
      if (displayHdcedBeforeMtd || pedBeforeMtd) {
        if (mtdBeforeCrd) {
          return 'Release from Detention and training order (DTO) cannot happen until release from the sentence (earliest would be the Conditional release date)'
        }
        if (mtdBeforeArd) {
          return 'Release from Detention and training order (DTO) cannot happen until release from the sentence (earliest would be the Automatic release date)'
        }
      }
      if (mtdBeforeHdced && (hdcedBeforeCrd || hdcedBeforeArd)) {
        return 'Release from the Detention and training order (DTO) cannot happen until release from the sentence (earliest would be the Home Detention Curfew Eligibility Date)'
      }
      if (mtdBeforePed && pedBeforeCrd) {
        return 'Release from Detention and training order (DTO) cannot happen until release from the sentence (earliest would be the Parole Eligibility Date)'
      }
    }
    return null
  }

  public ersedAdjustedByMtd(): boolean {
    const mtdBeforeCrd = this.dateBeforeAnother(this.releaseDates?.MTD, this.releaseDates?.CRD)
    const ersedBeforeMtd = this.dateBeforeAnother(this.releaseDates?.ERSED, this.releaseDates?.MTD)
    return ersedBeforeMtd && mtdBeforeCrd
  }

  public ersedNotApplicableDueToDtoLaterThanCrd(): boolean {
    const ersedBeforeCrd = this.dateBeforeAnother(this.releaseDates?.ERSED, this.releaseDates?.CRD)
    const crdBeforeMtd = this.dateBeforeAnother(this.releaseDates?.CRD, this.releaseDates?.MTD)
    return ersedBeforeCrd && crdBeforeMtd
  }
}

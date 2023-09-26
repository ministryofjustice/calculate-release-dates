import dayjs from 'dayjs'
import { DateTime } from 'luxon'
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
    public hasNone: boolean,
    public viewJourney: boolean,
    public calculationBreakdown?: CalculationBreakdown,
    public releaseDatesWithAdjustments?: ReleaseDateWithAdjustments[],
    public validationErrors?: ErrorMessages,
    public calculationSummaryUnavailable?: boolean,
    public dpsEntryPoint?: boolean,
    public approvedDates?: { [key: string]: string },
    public overrideReason?: string
  ) {
    // intentionally left blank
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

  public hdcedBannerConfig(): string {
    if (this.releaseDates?.HDCED) {
      const now = dayjs()
      const hdcedChangeDate = dayjs('2023-06-06')
      if (now.isBefore(hdcedChangeDate)) {
        return '<h2 class="govuk-heading-m">From 6 June, the policy for calculating HDCED will change</h2> <p class="govuk-body">For this calculation, this service has used the existing HDCED policy rules. From 6 June, this service will calculate HDCEDs using the new policy rules.</p><p class="govuk-body">NOMIS has already been updated to reflect the new policy.</p>'
      }
      return '<h2 class="govuk-heading-m">From 6 June, the policy for calculating HDCED has changed</h2><p class="govuk-body">This service has calculated the HDCED using the new policy rules.</p>'
    }
    return ''
  }

  public getHints(type: string): string[] {
    const hints = [] as string[]
    const longFormat = 'cccc, dd LLLL yyyy'
    if (this.weekendAdjustments[type]) {
      const releaseDate = DateTime.fromISO(this.weekendAdjustments[type].date).toFormat(longFormat)
      hints.push(
        `<p class="govuk-body govuk-hint govuk-!-font-size-16" data-qa="${type}-weekend-adjustment">${releaseDate} when adjusted to a working day</p>`
      )
    }
    if (type === 'ARD' && this.displayArdBeforeMtd()) {
      hints.push(
        '<p class="govuk-body govuk-hint govuk-!-font-size-16">The Detention and training order (DTO) release date is later than the Automatic Release Date (ARD)</p>'
      )
    }
    if (type === 'CRD' && this.displayCrdBeforeMtd()) {
      hints.push(
        '<p class="govuk-body govuk-hint govuk-!-font-size-16">The Detention and training order (DTO) release date is later than the Conditional Release Date (CRD)</p>'
      )
    }
    if (type === 'PED') {
      if (this.displayPedAdjustmentHint()) {
        const inserts = this.displayPedAdjustmentHint()
        hints.push(
          `<p class="govuk-body govuk-hint govuk-!-font-size-16">PED adjusted for the ${inserts} of a concurrent sentence or default term</p>`
        )
      }
      if (this.pedBeforePRRD()) {
        const prrd = DateTime.fromISO(this.calculationBreakdown.otherDates.PRRD).toFormat(longFormat)
        hints.push(
          `<p class="govuk-body govuk-hint govuk-!-font-size-16">The post recall release date (PRRD) of ${prrd} is later than the PED</p>`
        )
      }
      if (this.displayPedBeforeMtd()) {
        hints.push(
          '<p class="govuk-body govuk-hint govuk-!-font-size-16">The Detention and training order (DTO) release date is later than the Parole Eligibility Date (PED)</p>'
        )
      }
    }
    if (type === 'HDCED') {
      if (this.displayHdcedAdjustmentHint()) {
        const content = this.displayHdcedAdjustmentHint()
        hints.push(
          `<p class="govuk-body govuk-hint govuk-!-font-size-16">HDCED adjusted for the ${content} of a concurrent sentence or default term</p>`
        )
      }
      if (this.hdcedBeforePRRD()) {
        const prrd = DateTime.fromISO(this.calculationBreakdown.otherDates.PRRD).toFormat(longFormat)
        hints.push(
          `<p class="govuk-body govuk-hint govuk-!-font-size-16">Release on HDC must not take place before the PRRD ${prrd}</p>`
        )
      }
      if (this.displayHdcedBeforeMtd()) {
        hints.push(
          `<p class="govuk-body govuk-hint govuk-!-font-size-16">The Detention and training order (DTO) release date is later than the Home detention curfew eligibility date (HDCED)</p>`
        )
      }
    }
    if (type === 'MTD' && this.mtdHintText()) {
      hints.push(`<p class="govuk-body govuk-hint govuk-!-font-size-16">${this.mtdHintText()}</p>`)
    }
    if (type === 'ERSED') {
      if (this.displayErsedAdjustmentHint()) {
        hints.push(
          `<p class="govuk-body govuk-hint govuk-!-font-size-16">ERSED adjusted for the ARD of a concurrent default term</p>`
        )
      }
      if (this.ersedAdjustedByMtd()) {
        hints.push(
          `<p class="govuk-body govuk-hint govuk-!-font-size-16">Adjusted to Mid term date (MTD) of the Detention and training order (DTO)</p>`
        )
      }
    }
    return hints
  }
}

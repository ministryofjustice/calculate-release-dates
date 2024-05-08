import dayjs from 'dayjs'
import {
  CalculationBreakdown,
  CalculationReason,
  DetailedCalculationResults,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ReleaseDateWithAdjustments from '../@types/calculateReleaseDates/releaseDateWithAdjustments'
import { PrisonApiOffenderSentenceAndOffences, PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { ErrorMessages } from '../types/ErrorMessages'
import SentenceTypes from './SentenceTypes'

export default class CalculationSummaryViewModel {
  constructor(
    public calculationRequestId: number,
    public nomsId: string,
    public prisonerDetail: PrisonApiPrisoner,
    public sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
    public hasNone: boolean,
    public viewJourney: boolean,
    public calculationReference: string,
    public calculationReason?: CalculationReason,
    public otherReasonDescription?: string,
    public calculationDate?: string,
    public calculationBreakdown?: CalculationBreakdown,
    public releaseDatesWithAdjustments?: ReleaseDateWithAdjustments[],
    public validationErrors?: ErrorMessages,
    public calculationSummaryUnavailable?: boolean,
    public approvedDates?: { [key: string]: string },
    public overrideReason?: string,
    public detailedCalculationResults?: DetailedCalculationResults,
  ) {
    // intentionally left blank
  }

  public showBreakdown(): boolean {
    return (
      !!this.calculationBreakdown &&
      !this.detailedCalculationResults.dates?.PRRD &&
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

  private dateBeforeAnother(dateA: string, dateB: string): boolean {
    if (dateA && dateB) {
      const dayjsDateA = dayjs(dateA)
      const dayjsDateB = dayjs(dateB)
      return dayjsDateA < dayjsDateB
    }
    return false
  }

  public ersedNotApplicableDueToDtoLaterThanCrd(): boolean {
    const ersedBeforeCrd = this.dateBeforeAnother(
      this.detailedCalculationResults.dates?.ERSED?.date,
      this.detailedCalculationResults.dates?.CRD?.date,
    )
    const crdBeforeMtd = this.dateBeforeAnother(
      this.detailedCalculationResults.dates?.CRD?.date,
      this.detailedCalculationResults.dates?.MTD?.date,
    )
    return ersedBeforeCrd && crdBeforeMtd
  }
}

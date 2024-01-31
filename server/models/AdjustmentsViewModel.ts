import {
  PrisonApiBookingAdjustment,
  AnalyzedPrisonApiBookingAndSentenceAdjustments,
  PrisonApiSentenceAdjustmentValues,
} from '../@types/prisonApi/prisonClientTypes'
import { AnalyzedSentenceAndOffences } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

type AdjustmentViewModel = {
  aggregate: number
  details: AdjustmentDetailViewModel[]
  aggregateNewDaysSinceLastCalculation: number
}

type AdjustmentDetailViewModel = {
  from?: string
  to?: string
  days: number
  sentence?: number
  analysisResult?: string
}

export default class AdjustmentsViewModel {
  /** Number of additional days awarded */
  public additionalDaysAwarded: AdjustmentViewModel

  /** Number of recall sentence remand days */
  public recallSentenceRemand: AdjustmentViewModel

  /** Number of recall sentence tagged bail days */
  public recallSentenceTaggedBail: AdjustmentViewModel

  /** Number of remand days */
  public remand: AdjustmentViewModel

  /** Number of restored additional days awarded */
  public restoredAdditionalDaysAwarded: AdjustmentViewModel

  /** Number of tagged bail days */
  public taggedBail: AdjustmentViewModel

  /** Number unlawfully at large days */
  public unlawfullyAtLarge: AdjustmentViewModel

  /** Number of unused remand days */
  public unusedRemand: AdjustmentViewModel

  constructor(
    adjustments: AnalyzedPrisonApiBookingAndSentenceAdjustments,
    sententencesAndOffences: AnalyzedSentenceAndOffences[],
  ) {
    this.additionalDaysAwarded = this.adjustmentViewModel(
      adjustments.bookingAdjustments.filter(a => a.type === 'ADDITIONAL_DAYS_AWARDED'),
      sententencesAndOffences,
    )
    this.recallSentenceRemand = this.adjustmentViewModel(
      adjustments.sentenceAdjustments.filter(a => a.type === 'RECALL_SENTENCE_REMAND'),
      sententencesAndOffences,
    )
    this.recallSentenceTaggedBail = this.adjustmentViewModel(
      adjustments.sentenceAdjustments.filter(a => a.type === 'RECALL_SENTENCE_TAGGED_BAIL'),
      sententencesAndOffences,
    )
    this.remand = this.adjustmentViewModel(
      adjustments.sentenceAdjustments.filter(a => a.type === 'REMAND'),
      sententencesAndOffences,
    )
    this.unusedRemand = this.adjustmentViewModel(
      adjustments.sentenceAdjustments.filter(a => a.type === 'UNUSED_REMAND'),
      sententencesAndOffences,
    )
    this.restoredAdditionalDaysAwarded = this.adjustmentViewModel(
      adjustments.bookingAdjustments.filter(a => a.type === 'RESTORED_ADDITIONAL_DAYS_AWARDED'),
      sententencesAndOffences,
    )
    this.taggedBail = this.adjustmentViewModel(
      adjustments.sentenceAdjustments.filter(a => a.type === 'TAGGED_BAIL'),
      sententencesAndOffences,
    )
    this.unlawfullyAtLarge = this.adjustmentViewModel(
      adjustments.bookingAdjustments.filter(a => a.type === 'UNLAWFULLY_AT_LARGE'),
      sententencesAndOffences,
    )
  }

  private adjustmentViewModel(
    adjustments: (PrisonApiBookingAdjustment | PrisonApiSentenceAdjustmentValues)[],
    sententencesAndOffences: AnalyzedSentenceAndOffences[],
  ): AdjustmentViewModel {
    // Filter any sentence adjustments linked to a sentence thats not present on the booking (inactive).
    const filteredAdjustments = adjustments
      .filter(a => a.active)
      .filter(a => {
        if ('sentenceSequence' in a) {
          const sentence = sententencesAndOffences.find(s => {
            return s.sentenceSequence === a.sentenceSequence
          })
          return !!sentence
        }
        return true
      })
    const newAdjustments = filteredAdjustments.filter(a => a.analysisResult === 'NEW')
    return {
      aggregate: this.aggregateAdjustment(filteredAdjustments),
      details: filteredAdjustments.map(a => {
        return {
          from: a.fromDate,
          to: a.toDate,
          days: a.numberOfDays,
          sentence: 'sentenceSequence' in a ? a.sentenceSequence : null,
          analysisResult: a.analysisResult,
        }
      }),
      aggregateNewDaysSinceLastCalculation: this.aggregateAdjustment(newAdjustments),
    }
  }

  private aggregateAdjustment(adjustments: { numberOfDays?: number; active?: boolean }[]): number {
    return adjustments
      .filter(a => a.active)
      .map(a => a.numberOfDays)
      .reduce((sum, current) => sum + current, 0)
  }

  public hasAnyAdjustments(): boolean {
    return this.hasAnyDeductionAdjustments() || this.hasAnyAdditionAdjustments()
  }

  public hasAnyDeductionAdjustments(): boolean {
    return (
      this.recallSentenceRemand.aggregate !== 0 ||
      this.recallSentenceTaggedBail.aggregate !== 0 ||
      this.remand.aggregate !== 0 ||
      this.restoredAdditionalDaysAwarded.aggregate !== 0 ||
      this.taggedBail.aggregate !== 0 ||
      this.unusedRemand.aggregate !== 0
    )
  }

  public hasAnyAdditionAdjustments(): boolean {
    return this.additionalDaysAwarded.aggregate !== 0 || this.unlawfullyAtLarge.aggregate !== 0
  }
}

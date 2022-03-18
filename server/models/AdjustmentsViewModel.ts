import {
  PrisonApiBookingAdjustment,
  PrisonApiBookingAndSentenceAdjustments,
  PrisonApiSentenceAdjustmentValues,
} from '../@types/prisonApi/prisonClientTypes'

type AdjustmentViewModel = {
  aggregate: number
  details: AdjustmentDetailViewModel[]
}

type AdjustmentDetailViewModel = {
  from?: string
  to?: string
  days: number
  sentence?: number
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

  constructor(adjustments: PrisonApiBookingAndSentenceAdjustments) {
    this.additionalDaysAwarded = this.adjustmentViewModel(
      adjustments.bookingAdjustments.filter(a => a.type === 'ADDITIONAL_DAYS_AWARDED')
    )
    this.recallSentenceRemand = this.adjustmentViewModel(
      adjustments.sentenceAdjustments.filter(a => a.type === 'RECALL_SENTENCE_REMAND')
    )
    this.recallSentenceTaggedBail = this.adjustmentViewModel(
      adjustments.sentenceAdjustments.filter(a => a.type === 'RECALL_SENTENCE_TAGGED_BAIL')
    )
    this.remand = this.adjustmentViewModel(adjustments.sentenceAdjustments.filter(a => a.type === 'REMAND'))
    this.unusedRemand = this.adjustmentViewModel(
      adjustments.sentenceAdjustments.filter(a => a.type === 'UNUSED_REMAND')
    )
    this.restoredAdditionalDaysAwarded = this.adjustmentViewModel(
      adjustments.bookingAdjustments.filter(a => a.type === 'RESTORED_ADDITIONAL_DAYS_AWARDED')
    )
    this.taggedBail = this.adjustmentViewModel(adjustments.sentenceAdjustments.filter(a => a.type === 'TAGGED_BAIL'))
    this.unlawfullyAtLarge = this.adjustmentViewModel(
      adjustments.bookingAdjustments.filter(a => a.type === 'UNLAWFULLY_AT_LARGE')
    )
  }

  private adjustmentViewModel(
    adjustments: PrisonApiBookingAdjustment[] | PrisonApiSentenceAdjustmentValues[]
  ): AdjustmentViewModel {
    return {
      aggregate: this.aggregateAdjustment(adjustments),
      details: adjustments.map(a => {
        return {
          from: a.fromDate,
          to: a.toDate,
          days: a.numberOfDays,
          sentence: 'sentenceSequence' in a ? a.sentenceSequence : null,
        }
      }),
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

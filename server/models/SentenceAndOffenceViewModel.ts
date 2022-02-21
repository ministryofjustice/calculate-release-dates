import AggregatedAdjustments from '../@types/calculateReleaseDates/AggregatedAdjustments'
import {
  PrisonApiBookingAndSentenceAdjustments,
  PrisonApiOffenderSentenceAndOffences,
  PrisonApiPrisoner,
} from '../@types/prisonApi/prisonClientTypes'
import { groupBy, indexBy } from '../utils/utils'

export default class SentenceAndOffenceViewModel {
  public prisonerDetail: PrisonApiPrisoner

  public sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[]

  public adjustmentDetails: AggregatedAdjustments

  public caseToSentences: Map<number, PrisonApiOffenderSentenceAndOffences[]>

  public sentenceSequenceToSentence: Map<number, PrisonApiOffenderSentenceAndOffences>

  public static from(
    prisonerDetail: PrisonApiPrisoner,
    sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
    adjustments: PrisonApiBookingAndSentenceAdjustments
  ): SentenceAndOffenceViewModel {
    return {
      prisonerDetail,
      sentencesAndOffences,
      adjustmentDetails: this.aggregateAdjustments(adjustments),
      caseToSentences: groupBy(sentencesAndOffences, (sent: PrisonApiOffenderSentenceAndOffences) => sent.caseSequence),
      sentenceSequenceToSentence: indexBy(
        sentencesAndOffences,
        (sent: PrisonApiOffenderSentenceAndOffences) => sent.sentenceSequence
      ),
    }
  }

  private static aggregateAdjustments(adjustments: PrisonApiBookingAndSentenceAdjustments): AggregatedAdjustments {
    return {
      additionalDaysAwarded: this.aggregateAdjustment(
        adjustments.bookingAdjustments.filter(a => a.type === 'ADDITIONAL_DAYS_AWARDED')
      ),
      remand: this.aggregateAdjustment(adjustments.sentenceAdjustments.filter(a => a.type === 'REMAND')),
      restoredAdditionalDaysAwarded: this.aggregateAdjustment(
        adjustments.bookingAdjustments.filter(a => a.type === 'RESTORED_ADDITIONAL_DAYS_AWARDED')
      ),
      taggedBail: this.aggregateAdjustment(adjustments.sentenceAdjustments.filter(a => a.type === 'TAGGED_BAIL')),
      unlawfullyAtLarge: this.aggregateAdjustment(
        adjustments.bookingAdjustments.filter(a => a.type === 'UNLAWFULLY_AT_LARGE')
      ),
    }
  }

  private static aggregateAdjustment(adjustments: { numberOfDays?: number; active?: boolean }[]): number {
    return adjustments
      .filter(a => a.active)
      .map(a => a.numberOfDays)
      .reduce((sum, current) => sum + current, 0)
  }
}

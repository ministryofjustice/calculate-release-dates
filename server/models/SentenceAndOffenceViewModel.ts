import AggregatedTerms from '../@types/calculateReleaseDates/AggregatedTerms'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/PrisonApiOffenderSentenceAndOffences'
import { PrisonApiBookingAndSentenceAdjustments, PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { groupBy, indexBy } from '../utils/utils'
import AdjustmentsViewModel from './AdjustmentsViewModel'

export default class SentenceAndOffenceViewModel {
  public prisonerDetail: PrisonApiPrisoner

  public sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[]

  public adjustments: AdjustmentsViewModel

  public caseToSentences: Map<number, PrisonApiOffenderSentenceAndOffences[]>

  public sentenceSequenceToSentence: Map<number, PrisonApiOffenderSentenceAndOffences>

  public sentenceSequenceToTermsAggregate: Map<number, AggregatedTerms>

  public static from(
    prisonerDetail: PrisonApiPrisoner,
    sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
    adjustments: PrisonApiBookingAndSentenceAdjustments
  ): SentenceAndOffenceViewModel {
    return {
      prisonerDetail,
      sentencesAndOffences,
      adjustments: new AdjustmentsViewModel(adjustments),
      caseToSentences: groupBy(sentencesAndOffences, (sent: PrisonApiOffenderSentenceAndOffences) => sent.caseSequence),
      sentenceSequenceToSentence: indexBy(
        sentencesAndOffences,
        (sent: PrisonApiOffenderSentenceAndOffences) => sent.sentenceSequence
      ),
      sentenceSequenceToTermsAggregate: sentencesAndOffences.reduce(
        (map: Map<number, AggregatedTerms>, sent: PrisonApiOffenderSentenceAndOffences) => {
          map.set(sent.sentenceSequence, {
            years: sent.terms.map(t => t.years).reduce((sum, current) => sum + current, 0) || 0,
            months: sent.terms.map(t => t.months).reduce((sum, current) => sum + current, 0) || 0,
            weeks: sent.terms.map(t => t.weeks).reduce((sum, current) => sum + current, 0) || 0,
            days: sent.terms.map(t => t.days).reduce((sum, current) => sum + current, 0) || 0,
          } as AggregatedTerms)
          return map
        },
        new Map<number, AggregatedTerms>()
      ),
    }
  }
}

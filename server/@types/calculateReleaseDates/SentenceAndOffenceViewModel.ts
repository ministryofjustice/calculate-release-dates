import {
  PrisonApiBookingAndSentenceAdjustments,
  PrisonApiOffenderSentenceAndOffences,
  PrisonApiPrisoner,
} from '../prisonApi/prisonClientTypes'

/*
    The view model required to render the table of sentences, offences and adjustments.
*/
type SentenceAndOffenceViewModel = {
  prisonerDetail: PrisonApiPrisoner
  sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[]
  adjustmentDetails: PrisonApiBookingAndSentenceAdjustments
  caseToSentences: Map<number, PrisonApiOffenderSentenceAndOffences[]>
  sentenceSequenceToSentence: Map<number, PrisonApiOffenderSentenceAndOffences>
}

export default SentenceAndOffenceViewModel

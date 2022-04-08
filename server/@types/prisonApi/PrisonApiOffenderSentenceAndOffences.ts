import { PrisonApiSentenceTerms } from './PrisonApiSentenceTerms'
import { PrisonApiOffenderOffence } from './prisonClientTypes'

// We're currently unable to generate the schema types for prison-api. This a temporary type until we can use openapi again.
export type PrisonApiOffenderSentenceAndOffences = {
  /** The bookingId this sentence and offence(s) relates to */
  bookingId?: number
  /** Case sequence - a number representing the order of the case this sentence belongs to */
  caseSequence?: number
  /** This sentence is consecutive to this sequence (if populated) */
  consecutiveToSequence?: number
  /** Sentence line sequence - a number representing the order */
  lineSequence?: number
  /** The offences related to this sentence (will usually only have one offence per sentence) */
  offences?: PrisonApiOffenderOffence[]
  /** The sentence calculation type e.g. R or ADIMP_ORA */
  sentenceCalculationType?: string
  /** The sentence category e.g. 2003 or Licence */
  sentenceCategory?: string
  /** The sentenced date for this sentence (aka court date) */
  sentenceDate?: string
  /** Sentence sequence - a unique identifier a sentence on a booking */
  sentenceSequence?: number
  /** This sentence status: A = Active I = Inactive */
  sentenceStatus?: string
  /** The sentence type description e.g. Standard Determinate Sentence */
  sentenceTypeDescription?: string
  /** The reference for the court case */
  caseReference?: string
  /** The court description */
  courtDescription?: string

  terms?: PrisonApiSentenceTerms[]
}

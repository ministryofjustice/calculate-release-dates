// We're currently unable to generate the schema types for prison-api. This a temporary type until we can use openapi again.
export type PrisonApiOffenderKeyDates = {
  homeDetentionCurfewEligibilityDate?: string
  earlyTermDate?: string
  midTermDate?: string
  lateTermDate?: string
  dtoPostRecallReleaseDate?: string
  automaticReleaseDate?: string
  conditionalReleaseDate?: string
  paroleEligibilityDate?: string
  nonParoleDate?: string
  licenceExpiryDate?: string
  postRecallReleaseDate?: string
  sentenceExpiryDate?: string
  topupSupervisionExpiryDate?: string
  effectiveSentenceEndDate?: string
  sentenceLength?: string
  judiciallyImposedSentenceLength?: string
}

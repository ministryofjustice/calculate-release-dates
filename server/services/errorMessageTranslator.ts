import { ValidationMessage } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/PrisonApiOffenderSentenceAndOffences'

export default function translateErrorToText(
  validationMessage: ValidationMessage,
  sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[]
): string[] {
  const sentencesAndOffence =
    validationMessage.sentenceSequence &&
    sentencesAndOffences.find(s => s.sentenceSequence === validationMessage.sentenceSequence)
  switch (validationMessage.code) {
    case 'UNSUPPORTED_SENTENCE_TYPE':
      return [validationMessage.arguments[0]]
    case 'OFFENCE_DATE_AFTER_SENTENCE_START_DATE':
      return [
        `The offence date for court case ${sentencesAndOffence.caseSequence} count ${sentencesAndOffence.lineSequence} must be before the sentence date.`,
      ]
    case 'OFFENCE_DATE_AFTER_SENTENCE_RANGE_DATE':
      return [
        `The offence date range for court case ${sentencesAndOffence.caseSequence} count ${sentencesAndOffence.lineSequence} must be before the sentence date.`,
      ]
    case 'OFFENCE_MISSING_DATE':
      return [
        `The calculation must include an offence date for court case ${sentencesAndOffence.caseSequence} count ${sentencesAndOffence.lineSequence}.`,
      ]
    case 'REMAND_FROM_TO_DATES_REQUIRED':
      return [`Remand periods must have a from and to date.`]
    case 'REMAND_OVERLAPS_WITH_REMAND':
      return [`Remand time can only be added once, it can cannot overlap with other remand dates.`]
    case 'REMAND_OVERLAPS_WITH_SENTENCE':
      return [`Remand time cannot be credited when a custodial sentence is being served.`]
    case 'SENTENCE_HAS_MULTIPLE_TERMS':
      return [
        `Court case ${sentencesAndOffence.caseSequence} count ${sentencesAndOffence.lineSequence} must only have one term in NOMIS.`,
      ]
    case 'CUSTODIAL_PERIOD_EXTINGUISHED':
      return [
        `The release date cannot be before the sentence date. Go back to NOMIS and reduce the amount of ${validationMessage.arguments
          .map(a => {
            return a === 'REMAND' ? 'remand' : 'tagged bail'
          })
          .join(' and ')} entered.`,
      ]
    case 'ADJUSTMENT_AFTER_RELEASE':
    case 'ADJUSTMENT_FUTURE_DATED':
      return validationMessage.arguments.map(a => {
        switch (a) {
          case 'ADDITIONAL_DAYS_AWARDED':
            return 'The from date for Additional days awarded (ADA) should be the date of the adjudication hearing.'
          case 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED':
            return 'The from date for Restored additional days awarded (RADA) must be the date the additional days were remitted.'
          case 'UNLAWFULLY_AT_LARGE':
            return 'The from date for Unlawfully at large (UAL) must be the first day the prisoner was deemed UAL.'
          default:
            return ''
        }
      })
    case 'MULTIPLE_SENTENCES_CONSECUTIVE_TO':
      return [
        `There are multiple sentences that are consecutive to court case ${sentencesAndOffence.caseSequence} count ${sentencesAndOffence.lineSequence}. A sentence should only have one other sentence consecutive to it.`,
      ]
    case 'SEC_91_SENTENCE_TYPE_INCORRECT':
    case 'EDS18_EDS21_EDSU18_SENTENCE_TYPE_INCORRECT':
    case 'LASPO_AR_SENTENCE_TYPE_INCORRECT':
    case 'SEC236A_SENTENCE_TYPE_INCORRECT':
    case 'SOPC18_SOPC21_SENTENCE_TYPE_INCORRECT':
      return [
        `The sentence type for court case ${sentencesAndOffence.caseSequence} count ${sentencesAndOffence.lineSequence} is invalid for the sentence date entered.`,
      ]
    case 'SENTENCE_HAS_NO_IMPRISONMENT_TERM':
      return [
        `Court case ${sentencesAndOffence.caseSequence} count ${sentencesAndOffence.lineSequence} must include an imprisonment term.`,
      ]
    case 'SENTENCE_HAS_NO_LICENCE_TERM':
      return [
        `Court case ${sentencesAndOffence.caseSequence} count ${sentencesAndOffence.lineSequence} must include a licence term.`,
      ]
    case 'ZERO_IMPRISONMENT_TERM':
      return [
        `Court case ${sentencesAndOffence.caseSequence} count ${sentencesAndOffence.lineSequence} must include an imprisonment term greater than zero.`,
      ]
    case 'EDS_LICENCE_TERM_LESS_THAN_ONE_YEAR':
      return [
        `Court case ${sentencesAndOffence.caseSequence} count ${sentencesAndOffence.lineSequence} must have a licence term of at least one year.`,
      ]
    case 'EDS_LICENCE_TERM_MORE_THAN_EIGHT_YEARS':
      return [
        `Court case ${sentencesAndOffence.caseSequence} count ${sentencesAndOffence.lineSequence} must have a licence term that does not exceed 8 years.`,
      ]
    case 'MORE_THAN_ONE_IMPRISONMENT_TERM':
      return [
        `Court case ${sentencesAndOffence.caseSequence} count ${sentencesAndOffence.lineSequence} must only have one imprisonment term.`,
      ]
    case 'MORE_THAN_ONE_LICENCE_TERM':
      return [
        `Court case ${sentencesAndOffence.caseSequence} count ${sentencesAndOffence.lineSequence} must only have one licence term.`,
      ]
    case 'SOPC_LICENCE_TERM_NOT_12_MONTHS':
      return [
        `Court case ${sentencesAndOffence.caseSequence} count ${sentencesAndOffence.lineSequence} must include a licence term of 12 months or 1 year.`,
      ]
    default:
      throw new Error(`Uknown validation code ${validationMessage.code}`)
  }
}

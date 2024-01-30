import type { ComparisonOverview } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ComparisonResultMismatch from './ComparisonResultMismatch'
import ComparisonType from '../enumerations/comparisonType'
import Hdced4PlusResultDate from './Hdced4PlusResultDate'
import PrisonApiClient from '../api/prisonApiClient'

export default class ComparisonResultOverviewModel {
  comparisonShortReference: string

  prisonName: string

  comparisonType: ComparisonType

  calculatedAt: string

  calculatedBy: string

  numberOfMismatches: number

  numberOfPeopleCompared: number

  releaseDateMismatches: ComparisonResultMismatch[]

  unsupportedSentenceTypeMismatches: ComparisonResultMismatch[]

  unsupportedSentenceTypeHdc4PlusMismatches: ComparisonResultMismatch[]

  validationErrorMismatches: ComparisonResultMismatch[]

  validationHdc4PlusMismatches: ComparisonResultMismatch[]

  status: string

  hdced4PlusMismatches: Hdced4PlusResultDate[]

  constructor(comparison: ComparisonOverview, prisons: Map<string, string>, token: string) {
    this.comparisonShortReference = comparison.comparisonShortReference
    const comparisonType = comparison.comparisonType as ComparisonType
    if (comparisonType !== ComparisonType.MANUAL) {
      this.prisonName = prisons.get(comparison.prison) ?? comparison.prison
    }
    this.comparisonType = comparison.comparisonType as ComparisonType
    this.calculatedAt = comparison.calculatedAt
    this.calculatedBy = comparison.calculatedByUsername
    this.numberOfMismatches = comparison.numberOfMismatches
    this.numberOfPeopleCompared = comparison.numberOfPeopleCompared

    this.releaseDateMismatches = comparison.mismatches
      .filter(mismatch => mismatch.misMatchType === 'RELEASE_DATES_MISMATCH')
      .map(mismatch => new ComparisonResultMismatch(mismatch, comparison.comparisonShortReference, comparisonType))

    if (this.comparisonType === ComparisonType.ESTABLISHMENT_HDCED4PLUS) {
      this.unsupportedSentenceTypeHdc4PlusMismatches = comparison.mismatches
        .filter(mismatch => mismatch.misMatchType === 'UNSUPPORTED_SENTENCE_TYPE_FOR_HDC4_PLUS')
        .sort((a, b) => a.personId.localeCompare(b.personId))
        .map(mismatch => new ComparisonResultMismatch(mismatch, comparison.comparisonShortReference, comparisonType))
    } else {
      this.unsupportedSentenceTypeMismatches = comparison.mismatches
        .filter(
          mismatch =>
            mismatch.misMatchType === 'UNSUPPORTED_SENTENCE_TYPE_FOR_HDC4_PLUS' ||
            mismatch.misMatchType === 'UNSUPPORTED_SENTENCE_TYPE'
        )
        .sort((a, b) => a.personId.localeCompare(b.personId))
        .map(mismatch => new ComparisonResultMismatch(mismatch, comparison.comparisonShortReference, comparisonType))
    }

    const validationErrorMismatchTypes = ['VALIDATION_ERROR']
    if (comparisonType === ComparisonType.ESTABLISHMENT_HDCED4PLUS) {
      this.validationHdc4PlusMismatches = comparison.mismatches
        .filter(mismatch => mismatch.misMatchType === 'VALIDATION_ERROR_HDC4_PLUS')
        .sort((a, b) => a.personId.localeCompare(b.personId))
        .map(mismatch => new ComparisonResultMismatch(mismatch, comparison.comparisonShortReference, comparisonType))
    } else {
      validationErrorMismatchTypes.push('VALIDATION_ERROR_HDC4_PLUS')
    }

    this.validationErrorMismatches = comparison.mismatches
      .filter(mismatch => validationErrorMismatchTypes.includes(mismatch.misMatchType))
      .sort((a, b) => a.personId.localeCompare(b.personId))
      .map(mismatch => new ComparisonResultMismatch(mismatch, comparison.comparisonShortReference, comparisonType))
    this.status = comparison.status
    this.hdced4PlusMismatches = comparison.mismatches
      .filter(mismatch => !['VALIDATION_ERROR', 'VALIDATION_ERROR_HDC4_PLUS'].includes(mismatch.misMatchType))
      .filter(mismatch => !!mismatch.hdcedFourPlusDate)
      .sort((a, b) => a.establishment.localeCompare(b.establishment))
      .map(mismatch => new Hdced4PlusResultDate(mismatch, comparison.prison))
  }
}

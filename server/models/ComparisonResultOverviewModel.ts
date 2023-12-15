import type { ComparisonOverview } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ComparisonResultMismatch from './ComparisonResultMismatch'
import ComparisonType from '../enumerations/comparisonType'

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

  validationErrorMismatches: ComparisonResultMismatch[]

  status: string

  constructor(comparison: ComparisonOverview, prisons: Map<string, string>) {
    const isManual = comparison.comparisonType === ComparisonType.MANUAL
    this.comparisonShortReference = comparison.comparisonShortReference
    if (!isManual) {
      this.prisonName = prisons.get(comparison.prison) ?? comparison.prison
    }
    this.comparisonType = comparison.comparisonType as ComparisonType
    this.calculatedAt = comparison.calculatedAt
    this.calculatedBy = comparison.calculatedByUsername
    this.numberOfMismatches = comparison.numberOfMismatches
    this.numberOfPeopleCompared = comparison.numberOfPeopleCompared

    this.releaseDateMismatches = comparison.mismatches
      .filter(mismatch => mismatch.misMatchType === 'RELEASE_DATES_MISMATCH')
      .map(mismatch => new ComparisonResultMismatch(mismatch, comparison.comparisonShortReference, isManual))
    this.unsupportedSentenceTypeMismatches = comparison.mismatches
      .filter(mismatch => mismatch.misMatchType === 'UNSUPPORTED_SENTENCE_TYPE')
      .sort((a, b) => a.personId.localeCompare(b.personId))
      .map(mismatch => new ComparisonResultMismatch(mismatch, comparison.comparisonShortReference, isManual))
    this.validationErrorMismatches = comparison.mismatches
      .filter(mismatch => mismatch.misMatchType === 'VALIDATION_ERROR')
      .sort((a, b) => a.personId.localeCompare(b.personId))
      .map(mismatch => new ComparisonResultMismatch(mismatch, comparison.comparisonShortReference, isManual))
    this.status = comparison.status
  }
}

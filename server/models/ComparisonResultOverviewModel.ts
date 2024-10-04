import type { ComparisonOverview } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ComparisonType from '../enumerations/comparisonType'
import MismatchResultTable from './MismatchResultTable'
import ReleaseDatesMismatchResultTable from './ReleaseDatesMismatchResultTable'

export default class ComparisonResultOverviewModel {
  comparisonShortReference: string

  prisonName: string

  comparisonType: ComparisonType

  calculatedAt: string

  calculatedBy: string

  numberOfMismatches: number

  numberOfPeopleCompared: number

  numberOfPeopleComparisonFailedFor: number

  releaseDateMismatchesTable: ReleaseDatesMismatchResultTable

  unsupportedSentenceMismatchesTable: MismatchResultTable

  status: string

  validationErrorMismatchesTable: MismatchResultTable

  constructor(comparison: ComparisonOverview, prisons: Map<string, string>) {
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
    this.numberOfPeopleComparisonFailedFor = comparison.numberOfPeopleComparisonFailedFor

    this.releaseDateMismatchesTable = new ReleaseDatesMismatchResultTable(comparison)

    const unsupportedSentenceMismatchTypes = ['UNSUPPORTED_SENTENCE_TYPE']

    this.unsupportedSentenceMismatchesTable = new MismatchResultTable(comparison, unsupportedSentenceMismatchTypes)

    const validationErrorMismatchTypes = ['VALIDATION_ERROR']
    this.validationErrorMismatchesTable = new MismatchResultTable(comparison, validationErrorMismatchTypes)

    this.status = comparison.status
  }
}

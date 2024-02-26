import type { ComparisonOverview } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ComparisonType from '../enumerations/comparisonType'
import Hdced4PlusResultDateTable from './Hdced4PlusResultDateTable'
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

  releaseDateMismatchesTable: ReleaseDatesMismatchResultTable

  unsupportedSentenceMismatchesTable: MismatchResultTable

  status: string

  validationErrorMismatchesTable: MismatchResultTable

  hdced4PlusMismatchesTable: Hdced4PlusResultDateTable

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

    this.releaseDateMismatchesTable = new ReleaseDatesMismatchResultTable(comparison)

    const unsupportedSentenceMismatchTypes = ['UNSUPPORTED_SENTENCE_TYPE_FOR_HDC4_PLUS']
    if (this.comparisonType !== ComparisonType.ESTABLISHMENT_HDCED4PLUS) {
      unsupportedSentenceMismatchTypes.push('UNSUPPORTED_SENTENCE_TYPE')
    }

    this.unsupportedSentenceMismatchesTable = new MismatchResultTable(comparison, unsupportedSentenceMismatchTypes)

    const validationErrorMismatchTypes = ['VALIDATION_ERROR_HDC4_PLUS']
    if (comparisonType !== ComparisonType.ESTABLISHMENT_HDCED4PLUS) {
      validationErrorMismatchTypes.push('VALIDATION_ERROR')
    }
    this.validationErrorMismatchesTable = new MismatchResultTable(comparison, validationErrorMismatchTypes)

    this.status = comparison.status
    this.hdced4PlusMismatchesTable = new Hdced4PlusResultDateTable(comparison.hdc4PlusCalculated, comparison.prison)
  }
}

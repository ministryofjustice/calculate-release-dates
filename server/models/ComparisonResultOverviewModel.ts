import type { ComparisonOverview } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ComparisonResultMismatch from './ComparisonResultMismatch'

export default class ComparisonResultOverviewModel {
  comparisonShortReference: string

  prisonName: string

  calculatedAt: string

  calculatedBy: string

  numberOfMismatches: number

  numberOfPeopleCompared: number

  mismatches: ComparisonResultMismatch[]

  status: string

  constructor(comparison: ComparisonOverview, prisons: Map<string, string>, isManual: boolean) {
    this.comparisonShortReference = comparison.comparisonShortReference
    if (!isManual) {
      this.prisonName = prisons.get(comparison.prison) ?? comparison.prison
    }
    this.calculatedAt = comparison.calculatedAt
    this.calculatedBy = comparison.calculatedByUsername
    this.numberOfMismatches = comparison.numberOfMismatches
    this.numberOfPeopleCompared = comparison.numberOfPeopleCompared
    this.mismatches = comparison.mismatches.map(
      mismatch => new ComparisonResultMismatch(mismatch, comparison.comparisonShortReference, isManual)
    )
    this.status = comparison.status
  }
}

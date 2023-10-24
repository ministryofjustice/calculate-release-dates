import type { Comparison, ComparisonSummary } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

export default class ListComparisonViewModel {
  comparisonShortReference: string

  prisonName: string

  calculatedAt: string

  calculatedBy: string

  numberOfMismatches: number

  numberOfPeopleCompared: number

  constructor(comparison: ComparisonSummary, prisons: Map<string, string>) {
    this.comparisonShortReference = comparison.comparisonShortReference
    this.prisonName = prisons.get(comparison.prison) ?? comparison.prison
    this.calculatedAt = comparison.calculatedAt
    this.calculatedBy = comparison.calculatedByUsername
    this.numberOfMismatches = comparison.numberOfMismatches
    this.numberOfPeopleCompared = comparison.numberOfPeopleCompared
  }
}

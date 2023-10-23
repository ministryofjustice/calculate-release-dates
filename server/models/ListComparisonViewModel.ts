import type { Comparison } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

export default class ListComparisonViewModel {
  comparisonShortReference: string

  prisonName: string

  calculatedAt: string

  calculatedBy: string

  numberOfMismatches: number

  numberOfPeopleCompared: number

  constructor(comparison: Comparison, prisons: Map<string, string>) {
    this.comparisonShortReference = comparison.comparisonShortReference
    this.prisonName = prisons.get(comparison.prison) ?? comparison.prison
    this.calculatedAt = comparison.calculatedAt
    this.calculatedBy = comparison.calculatedByUsername
    this.numberOfMismatches = 9 // TODO: expose from API
    this.numberOfPeopleCompared = comparison.numberOfPeopleCompared
  }
}

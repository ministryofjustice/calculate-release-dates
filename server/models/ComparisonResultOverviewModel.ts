import type { Comparison } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ComparisonResultMismatch from './ComparisonResultMismatch'

export default class ComparisonResultOverviewModel {
  comparisonShortReference: string

  prisonName: string

  calculatedAt: string

  calculatedBy: string

  numberOfMismatches: number

  numberOfPeopleCompared: number

  mismatches: ComparisonResultMismatch[]

  constructor(comparison: Comparison, prisons: Map<string, string>) {
    this.comparisonShortReference = comparison.comparisonShortReference
    this.prisonName = prisons.get(comparison.prison) ?? comparison.prison
    this.calculatedAt = comparison.calculatedAt
    this.calculatedBy = comparison.calculatedByUsername
    this.numberOfMismatches = 9 // TODO: expose from API
    this.numberOfPeopleCompared = comparison.numberOfPeopleCompared
    this.mismatches = [
      new ComparisonResultMismatch('A8031DY', 'Release dates mismatch', comparison.comparisonShortReference, '1'),
      new ComparisonResultMismatch('A8756DZ', 'Unsupported calculation', comparison.comparisonShortReference, '2'),
      new ComparisonResultMismatch('A1798DZ', 'NOMIS input errors', comparison.comparisonShortReference, '3'),
      new ComparisonResultMismatch('A8031DY', 'Release dates mismatch', comparison.comparisonShortReference, '4'),
      new ComparisonResultMismatch('A8756DZ', 'Unsupported calculation', comparison.comparisonShortReference, '5'),
      new ComparisonResultMismatch('A1798DZ', 'NOMIS input errors', comparison.comparisonShortReference, '6'),
    ] // TODO: expose from API
  }
}

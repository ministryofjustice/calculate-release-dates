import type { ComparisonSummary } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ComparisonType from '../enumerations/comparisonType'

export default class ListComparisonViewModel {
  comparisonShortReference: string

  prisonName: string

  comparisonType: ComparisonType

  calculatedAt: string

  calculatedBy: string

  numberOfMismatches: number

  numberOfPeopleComparisonFailedFor: number

  numberOfPeopleCompared: number

  percentageComplete: number

  expectedCompletionTime: string

  numberOfPeopleExpected: number

  status: string

  constructor(comparison: ComparisonSummary, prisons: Map<string, string>) {
    this.comparisonShortReference = comparison.comparisonShortReference
    this.prisonName = prisons.get(comparison.prison) ?? comparison.prison
    this.comparisonType = comparison.comparisonType as ComparisonType
    this.calculatedAt = comparison.calculatedAt
    this.calculatedBy = comparison.calculatedByUsername
    this.numberOfMismatches = comparison.numberOfMismatches
    this.numberOfPeopleCompared = comparison.numberOfPeopleCompared
    this.numberOfPeopleComparisonFailedFor = comparison.numberOfPeopleComparisonFailedFor
    this.percentageComplete = Math.floor(comparison.comparisonProgress.percentageComplete)
    this.expectedCompletionTime = comparison.comparisonProgress.expectedCompletionTime
    this.numberOfPeopleExpected = comparison.numberOfPeopleExpected
    this.status = comparison.comparisonStatus
  }
}

import {
  Comparison,
  ComparisonOverview,
  ComparisonPersonDiscrepancyRequest,
  ComparisonPersonDiscrepancySummary,
  ComparisonPersonOverview,
  ComparisonSummary,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import CalculateReleaseDatesApiClient from '../api/calculateReleaseDatesApiClient'
import ComparisonType from '../enumerations/comparisonType'

export default class ComparisonService {
  async createPrisonComparison(
    selectedOMU: string,
    comparisonType: ComparisonType,
    token: string,
  ): Promise<Comparison> {
    return new CalculateReleaseDatesApiClient(token).createPrisonComparison(selectedOMU, comparisonType)
  }

  async getPrisonComparison(bulkComparisonId: string, token: string): Promise<ComparisonOverview> {
    return new CalculateReleaseDatesApiClient(token).getPrisonComparison(bulkComparisonId)
  }

  async getPrisonComparisons(token: string): Promise<ComparisonSummary[]> {
    return new CalculateReleaseDatesApiClient(token).getPrisonComparisons()
  }

  async getManualComparisons(token: string): Promise<ComparisonSummary[]> {
    return new CalculateReleaseDatesApiClient(token).getManualComparisons()
  }

  async createManualComparison(nomsIds: string[], token: string): Promise<Comparison> {
    return new CalculateReleaseDatesApiClient(token).createManualComparison(nomsIds)
  }

  async getManualComparison(bulkComparisonId: string, token: string): Promise<ComparisonOverview> {
    return new CalculateReleaseDatesApiClient(token).getManualComparison(bulkComparisonId)
  }

  async getPrisonMismatchComparison(
    bulkComparisonId: string,
    bulkComparisonMismatchId: string,
    token: string,
  ): Promise<ComparisonPersonOverview> {
    return new CalculateReleaseDatesApiClient(token).getPrisonMismatchComparison(
      bulkComparisonId,
      bulkComparisonMismatchId,
    )
  }

  async getManualMismatchComparison(
    bulkComparisonId: string,
    bulkComparisonMismatchId: string,
    token: string,
  ): Promise<ComparisonPersonOverview> {
    return new CalculateReleaseDatesApiClient(token).getManualMismatchComparison(
      bulkComparisonId,
      bulkComparisonMismatchId,
    )
  }

  async getComparisonPersonDiscrepancy(
    bulkComparisonId: string,
    bulkComparisonMismatchId: string,
    token: string,
  ): Promise<ComparisonPersonDiscrepancySummary> {
    return new CalculateReleaseDatesApiClient(token).getMismatchDiscrepancy(bulkComparisonId, bulkComparisonMismatchId)
  }

  async getManualComparisonPersonDiscrepancy(
    bulkComparisonId: string,
    bulkComparisonMismatchId: string,
    token: string,
  ): Promise<ComparisonPersonDiscrepancySummary> {
    return new CalculateReleaseDatesApiClient(token).getManualMismatchDiscrepancy(
      bulkComparisonId,
      bulkComparisonMismatchId,
    )
  }

  async createComparisonPersonDiscrepancy(
    bulkComparisonId: string,
    bulkComparisonMismatchId: string,
    discrepancy: ComparisonPersonDiscrepancyRequest,
    token: string,
  ): Promise<ComparisonPersonDiscrepancySummary> {
    return new CalculateReleaseDatesApiClient(token).createMismatchDiscrepancy(
      bulkComparisonId,
      bulkComparisonMismatchId,
      discrepancy,
    )
  }

  async createManualComparisonPersonDiscrepancy(
    bulkComparisonId: string,
    bulkComparisonMismatchId: string,
    discrepancy: ComparisonPersonDiscrepancyRequest,
    token: string,
  ): Promise<ComparisonPersonDiscrepancySummary> {
    return new CalculateReleaseDatesApiClient(token).createManualMismatchDiscrepancy(
      bulkComparisonId,
      bulkComparisonMismatchId,
      discrepancy,
    )
  }
}

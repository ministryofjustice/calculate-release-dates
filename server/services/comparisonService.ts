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
import AuditService from './auditService'

export default class ComparisonService {
  constructor(private auditService: AuditService) {}

  async createPrisonComparison(
    userName: string,
    selectedOMU: string,
    comparisonType: ComparisonType,
    token: string,
  ): Promise<Comparison> {
    try {
      const bulkCalc = await new CalculateReleaseDatesApiClient(token).createPrisonComparison(
        selectedOMU,
        comparisonType,
      )
      await this.auditService.publishBulkComparison(
        userName,
        selectedOMU,
        bulkCalc.comparisonShortReference,
        bulkCalc.comparisonType,
      )
      return bulkCalc
    } catch (error) {
      await this.auditService.publishBulkComparisonFailure(userName, selectedOMU, error)
      throw error
    }
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

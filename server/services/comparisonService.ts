import {
  Comparison,
  ComparisonOverview,
  ComparisonPersonDiscrepancyRequest,
  ComparisonPersonDiscrepancySummary,
  ComparisonPersonOverview,
  ComparisonSummary,
  PageComparisonSummary,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import {
  UnusedDeductionsComparisonInput,
  UnusedDeductionsComparisonOverview,
  UnusedDeductionsComparisonPage,
  UnusedDeductionsComparisonOverviewOptions,
  UnusedDeductionsComparisonPersonDetail,
  UnusedDeductionsComparisonSummary,
} from '../@types/calculateReleaseDates/unusedDeductionsComparisonTypes'
import ComparisonType from '../enumerations/comparisonType'
import AuditService from './auditService'
import CalculateReleaseDatesApiClient from '../data/calculateReleaseDatesApiClient'

export default class ComparisonService {
  constructor(
    private readonly auditService: AuditService,
    private readonly calculateReleaseDatesApiClient: CalculateReleaseDatesApiClient,
  ) {}

  async createPrisonComparison(
    userName: string,
    selectedOMU: string,
    comparisonType: ComparisonType,
  ): Promise<Comparison> {
    try {
      const bulkCalc = await this.calculateReleaseDatesApiClient.createPrisonComparison(
        selectedOMU,
        comparisonType,
        userName,
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

  async createUnusedDeductionsComparison(
    input: UnusedDeductionsComparisonInput,
    username: string,
  ): Promise<UnusedDeductionsComparisonSummary> {
    return this.calculateReleaseDatesApiClient.createUnusedDeductionsComparison(input, username)
  }

  async getUnusedDeductionsComparisons(
    page: number,
    size: number,
    username: string,
    calculatedByCurrentUser: boolean,
  ): Promise<UnusedDeductionsComparisonPage> {
    return this.calculateReleaseDatesApiClient.getUnusedDeductionsComparisons(
      page,
      size,
      username,
      calculatedByCurrentUser,
    )
  }

  async getUnusedDeductionsComparison(
    reference: string,
    options: UnusedDeductionsComparisonOverviewOptions,
    username: string,
  ): Promise<UnusedDeductionsComparisonOverview> {
    return this.calculateReleaseDatesApiClient.getUnusedDeductionsComparison(reference, options, username)
  }

  async getUnusedDeductionsComparisonPerson(
    reference: string,
    personReference: string,
    username: string,
  ): Promise<UnusedDeductionsComparisonPersonDetail> {
    return this.calculateReleaseDatesApiClient.getUnusedDeductionsComparisonPerson(reference, personReference, username)
  }

  async getPrisonComparison(bulkComparisonId: string, username: string): Promise<ComparisonOverview> {
    return this.calculateReleaseDatesApiClient.getPrisonComparison(bulkComparisonId, username)
  }

  async getPrisonComparisons(username: string): Promise<ComparisonSummary[]> {
    return this.calculateReleaseDatesApiClient.getPrisonComparisons(username)
  }

  async searchComparisons(
    prison: string,
    calculatedByCurrentUser: boolean,
    page: number,
    size: number,
    username: string,
  ): Promise<PageComparisonSummary> {
    return this.calculateReleaseDatesApiClient.searchComparisons(prison, calculatedByCurrentUser, page, size, username)
  }

  async getManualComparisons(username: string): Promise<ComparisonSummary[]> {
    return this.calculateReleaseDatesApiClient.getManualComparisons(username)
  }

  async createManualComparison(nomsIds: string[], username: string): Promise<Comparison> {
    return this.calculateReleaseDatesApiClient.createManualComparison(nomsIds, username)
  }

  async getManualComparison(bulkComparisonId: string, username: string): Promise<ComparisonOverview> {
    return this.calculateReleaseDatesApiClient.getManualComparison(bulkComparisonId, username)
  }

  async getPrisonMismatchComparison(
    bulkComparisonId: string,
    bulkComparisonMismatchId: string,
    username: string,
  ): Promise<ComparisonPersonOverview> {
    return this.calculateReleaseDatesApiClient.getPrisonMismatchComparison(
      bulkComparisonId,
      bulkComparisonMismatchId,
      username,
    )
  }

  async getManualMismatchComparison(
    bulkComparisonId: string,
    bulkComparisonMismatchId: string,
    username: string,
  ): Promise<ComparisonPersonOverview> {
    return this.calculateReleaseDatesApiClient.getManualMismatchComparison(
      bulkComparisonId,
      bulkComparisonMismatchId,
      username,
    )
  }

  async getComparisonPersonDiscrepancy(
    bulkComparisonId: string,
    bulkComparisonMismatchId: string,
    username: string,
  ): Promise<ComparisonPersonDiscrepancySummary> {
    return this.calculateReleaseDatesApiClient.getMismatchDiscrepancy(
      bulkComparisonId,
      bulkComparisonMismatchId,
      username,
    )
  }

  async getManualComparisonPersonDiscrepancy(
    bulkComparisonId: string,
    bulkComparisonMismatchId: string,
    username: string,
  ): Promise<ComparisonPersonDiscrepancySummary> {
    return this.calculateReleaseDatesApiClient.getManualMismatchDiscrepancy(
      bulkComparisonId,
      bulkComparisonMismatchId,
      username,
    )
  }

  async createComparisonPersonDiscrepancy(
    bulkComparisonId: string,
    bulkComparisonMismatchId: string,
    discrepancy: ComparisonPersonDiscrepancyRequest,
    username: string,
  ): Promise<ComparisonPersonDiscrepancySummary> {
    return this.calculateReleaseDatesApiClient.createMismatchDiscrepancy(
      bulkComparisonId,
      bulkComparisonMismatchId,
      discrepancy,
      username,
    )
  }

  async createManualComparisonPersonDiscrepancy(
    bulkComparisonId: string,
    bulkComparisonMismatchId: string,
    discrepancy: ComparisonPersonDiscrepancyRequest,
    username: string,
  ): Promise<ComparisonPersonDiscrepancySummary> {
    return this.calculateReleaseDatesApiClient.createManualMismatchDiscrepancy(
      bulkComparisonId,
      bulkComparisonMismatchId,
      discrepancy,
      username,
    )
  }
}

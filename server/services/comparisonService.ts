import type { Comparison } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import CalculateReleaseDatesApiClient from '../api/calculateReleaseDatesApiClient'

export default class ComparisonService {
  async createPrisonComparison(selectedOMU: string, token: string): Promise<Comparison> {
    return new CalculateReleaseDatesApiClient(token).createPrisonComparison(selectedOMU)
  }

  async getPrisonComparison(bulkComparisonId: string, token: string): Promise<Comparison> {
    return new CalculateReleaseDatesApiClient(token).getPrisonComparison(bulkComparisonId)
  }

  async getPrisonComparisons(token: string): Promise<Comparison[]> {
    return new CalculateReleaseDatesApiClient(token).getPrisonComparisons()
  }

  async getManualComparisons(token: string): Promise<Comparison[]> {
    return new CalculateReleaseDatesApiClient(token).getManualComparisons()
  }
}

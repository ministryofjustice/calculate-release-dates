import type { Comparison } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import CalculateReleaseDatesApiClient from '../api/calculateReleaseDatesApiClient'

export default class ComparisonService {
  async createPrisonComparison(selectedOMU: string, token: string): Promise<Comparison> {
    return new CalculateReleaseDatesApiClient(token).createPrisonComparison(selectedOMU)
  }
}

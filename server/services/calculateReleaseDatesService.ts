import CalculateReleaseDatesApiClient from '../data/calculateReleaseDatesApiClient'
import { TestData } from '../data/calculateReleaseDatesClientTypes'

export default class CalculateReleaseDatesService {
  constructor(private readonly calculateReleaseDatesApiClient: CalculateReleaseDatesApiClient) {}

  async getTestData(token: string): Promise<TestData[]> {
    return this.calculateReleaseDatesApiClient.getTestData(token)
  }
}

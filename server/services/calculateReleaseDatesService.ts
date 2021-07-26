import CalculateReleaseDatesApiClient from '../api/calculateReleaseDatesApiClient'
import { TestData } from '../api/calculateReleaseDatesClientTypes'
import HmppsAuthClient from '../api/hmppsAuthClient'

export default class CalculateReleaseDatesService {
  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {}

  async getTestData(username: string): Promise<TestData[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    return new CalculateReleaseDatesApiClient(token).getTestData()
  }
}

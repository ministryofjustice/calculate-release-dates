import config from '../config'
import RestClient from './restClient'
import { TestData } from './calculateReleaseDatesClientTypes'

export default class CalculateReleaseDatesApiClient {
  private restClient(token: string): RestClient {
    return new RestClient('Calculate Release Dates API', config.apis.calculateReleaseDates, token)
  }

  getTestData(token: string): Promise<TestData[]> {
    return this.restClient(token).get({ path: '/test/data' }) as Promise<TestData[]>
  }
}

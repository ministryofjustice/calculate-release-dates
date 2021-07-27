import config, { ApiConfig } from '../config'
import RestClient from './restClient'
import { TestData } from './calculateReleaseDatesClientTypes'

export default class CalculateReleaseDatesApiClient {
  restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient(
      'Calculate release dates API',
      config.apis.calculateReleaseDates as ApiConfig,
      token
    )
  }

  getTestData(): Promise<TestData[]> {
    return this.restClient.get({ path: '/test/data' }) as Promise<TestData[]>
  }
}

import { CcrdServiceDefinitions } from '../@types/courtCasesReleaseDatesApi/types'
import config, { ApiConfig } from '../config'
import RestClient from '../data/restClient'

export default class CourtCasesReleaseDatesApiClient {
  restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient(
      'Court Cases Release Dates API',
      config.apis.courtCasesReleaseDatesApi as ApiConfig,
      token,
    )
  }

  getServiceDefinitions(prisonerId: string): Promise<CcrdServiceDefinitions> {
    return this.restClient.get({
      path: `/service-definitions/prisoner/${prisonerId}`,
    }) as Promise<CcrdServiceDefinitions>
  }
}

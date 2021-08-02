import config, { ApiConfig } from '../config'
import RestClient from './restClient'
import { Prisoner, PrisonerSearchCriteria } from '../@types/prisonerOffenderSearch/prisonerSearchClientTypes'

export default class PrisonerSearchApiClient {
  restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient('Prisoner Search API', config.apis.prisonerSearch as ApiConfig, token)
  }

  searchPrisoners(prisonerSearchCriteria: PrisonerSearchCriteria): Promise<Prisoner[]> {
    return this.restClient.post({
      path: '/prisoner-search/match-prisoners',
      data: prisonerSearchCriteria,
    }) as Promise<Prisoner[]>
  }
}

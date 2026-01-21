import { asSystem, AuthenticationClient, RestClient } from '@ministryofjustice/hmpps-rest-client'
import config from '../config'
import { Prisoner, PrisonerSearchCriteria } from '../@types/prisonerOffenderSearch/prisonerSearchClientTypes'
import logger from '../../logger'

export default class PrisonerSearchApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Prisoner Search API', config.apis.prisonerSearch, logger, authenticationClient)
  }

  searchPrisoners(username: string, prisonerSearchCriteria: PrisonerSearchCriteria): Promise<Prisoner[]> {
    return this.post<Prisoner[]>(
      {
        path: '/prisoner-search/match-prisoners',
        data: prisonerSearchCriteria,
      },
      asSystem(username),
    )
  }
}

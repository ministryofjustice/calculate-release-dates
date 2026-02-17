import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { asUser, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { CcrdServiceDefinitions } from '../@types/courtCasesReleaseDatesApi/types'
import config from '../config'
import logger from '../../logger'

export default class CourtCasesReleaseDatesApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Court Cases Release Dates API', config.apis.courtCasesReleaseDatesApi, logger, authenticationClient)
  }

  getServiceDefinitions(prisonerId: string, token: string): Promise<CcrdServiceDefinitions> {
    return this.get<CcrdServiceDefinitions>({ path: `/service-definitions/prisoner/${prisonerId}` }, asUser(token))
  }
}

import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import FrontendComponent from '../models/FrontendComponent'
import config from '../config'
import logger from '../../logger'

export default class FrontendComponentsApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Frontend Components API', config.apis.frontendComponents, logger, authenticationClient)
  }

  async getComponents<T extends AvailableComponent[]>(
    components: T,
    authToken: string,
  ): Promise<Record<T[number], FrontendComponent>> {
    return this.get<Record<T[number], FrontendComponent>>(
      {
        path: `/components`,
        query: `component=${components.join('&component=')}`,
        headers: { 'x-user-token': authToken },
      },
      asSystem(),
    )
  }
}

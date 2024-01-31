import RestClient from '../data/restClient'
import FrontendComponent from '../models/FrontendComponent'
import config, { ApiConfig } from '../config'

export default class FrontendComponentsApiClient {
  restClient: RestClient

  token: string

  constructor() {
    this.restClient = new RestClient('Frontend Components API', config.apis.frontendComponents as ApiConfig, '')
  }

  async getComponents<T extends AvailableComponent[]>(
    components: T,
    authToken: string,
  ): Promise<Record<T[number], FrontendComponent>> {
    return this.restClient.get({
      path: `/components`,
      query: `component=${components.join('&component=')}`,
      headers: { 'x-user-token': authToken },
    }) as Promise<Record<T[number], FrontendComponent>>
  }
}

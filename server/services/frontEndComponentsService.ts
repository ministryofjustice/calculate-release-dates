import FrontendComponentsApiClient from '../api/frontendComponentsApiClient'

export default class FrontEndComponentsService {
  private frontEndComponentsApiClient

  constructor(frontEndComponentsApiClient: FrontendComponentsApiClient) {
    this.frontEndComponentsApiClient = frontEndComponentsApiClient
  }

  async getComponents(components: AvailableComponent[], authToken: string) {
    return this.frontEndComponentsApiClient.getComponents(components, authToken)
  }
}

import FrontendComponentsApiClient from '../api/frontendComponentsApiClient'
import HmppsAuthClient from '../data/hmppsAuthClient'

export default class FrontEndComponentsService {
  async getComponents(components: AvailableComponent[], authToken: string) {
    return new FrontendComponentsApiClient(authToken).getComponents(components, authToken)
  }
}

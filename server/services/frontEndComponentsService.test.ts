import FrontEndComponentsService from './frontEndComponentsService'
import FrontendComponentsApiClient from '../data/frontendComponentsApiClient'

jest.mock('../data/frontendComponentsApiClient')
const mockedFrontendComponentsApiClient = new FrontendComponentsApiClient(
  null,
) as jest.Mocked<FrontendComponentsApiClient>
const underTest = new FrontEndComponentsService(mockedFrontendComponentsApiClient)

describe('frontendComponentsService', () => {
  it('Should call the frontEndComponentRestClient', () => {
    // const mockAPIClient = FrontendComponentsApiClient.mock.instances[0];
    underTest.getComponents(['header'], '1234567')
    expect(mockedFrontendComponentsApiClient.getComponents).toHaveBeenCalledWith(['header'], '1234567')
  })
})

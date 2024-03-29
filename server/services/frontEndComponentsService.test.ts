import FrontEndComponentsService from './frontEndComponentsService'
import FrontendComponentsApiClient from '../api/frontendComponentsApiClient'

jest.mock('../api/frontendComponentsApiClient')
const mockedFrontendComponentsApiClient = new FrontendComponentsApiClient()
const underTest = new FrontEndComponentsService(mockedFrontendComponentsApiClient)

describe('frontendComponentsService', () => {
  it('Should call the frontEndComponentRestClient', () => {
    // const mockAPIClient = FrontendComponentsApiClient.mock.instances[0];
    underTest.getComponents(['header'], '1234567')
    expect(mockedFrontendComponentsApiClient.getComponents).toBeCalledWith(['header'], '1234567')
  })
})

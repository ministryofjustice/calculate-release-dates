import nock from 'nock'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import FrontendComponentsApiClient from './frontendComponentsApiClient'
import FrontEndComponentsService from '../services/frontEndComponentsService'

jest.mock('../services/auditService')

const mockAuthenticationClient: AuthenticationClient = {
  getToken: jest.fn().mockResolvedValue('test-system-token'),
} as unknown as jest.Mocked<AuthenticationClient>
const frontendComponentsApiClient = new FrontendComponentsApiClient(mockAuthenticationClient)
const frontendComponentsService = new FrontEndComponentsService(frontendComponentsApiClient)

const token = 'token'

describe('Front end components API client tests', () => {
  let fakeApi: nock.Scope

  beforeEach(() => {
    config.apis.frontendComponents.url = 'http://localhost:8100'
    fakeApi = nock(config.apis.frontendComponents.url)
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('Tests for API calls', () => {
    it('Get the front end components successfully', async () => {
      const response = { 1: { html: '<h1>hi</h1>' } }
      fakeApi.get(`/components?component=header`, '').reply(200, response)
      const data = await frontendComponentsService.getComponents(['header'], token)
      expect(data).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
    it('Getting the front end components returns a 401', async () => {
      fakeApi.get(`/components?component=header`, '').reply(401)
      const error = await frontendComponentsService.getComponents(['header'], token).catch(err => err)
      expect(error.responseStatus).toEqual(401)
      expect(nock.isDone()).toBe(true)
    })
  })
})

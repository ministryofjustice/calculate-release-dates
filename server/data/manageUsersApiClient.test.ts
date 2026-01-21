import nock from 'nock'

import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import ManageUsersApiClient from './manageUsersApiClient'

jest.mock('./tokenStore/redisTokenStore')

const token = { access_token: 'token-1', expires_in: 300 }

describe('manageUsersApiClient', () => {
  let fakeManageUsersApiClient: nock.Scope
  let manageUsersApiClient: ManageUsersApiClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    fakeManageUsersApiClient = nock(config.apis.manageUsersApi.url)
    mockAuthenticationClient = {
      getToken: jest.fn().mockResolvedValue('test-system-token'),
    } as unknown as jest.Mocked<AuthenticationClient>
    manageUsersApiClient = new ManageUsersApiClient(mockAuthenticationClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getUser', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeManageUsersApiClient
        .get('/users/me')
        .matchHeader('authorization', `Bearer ${token.access_token}`)
        .reply(200, response)

      const output = await manageUsersApiClient.getUser(token.access_token)
      expect(output).toEqual(response)
    })
  })
})

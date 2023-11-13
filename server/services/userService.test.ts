import nock from 'nock'
import UserService from './userService'
import { PrisonApiUserCaseloads } from '../@types/prisonApi/prisonClientTypes'
import config from '../config'
import { ManageUsersApiClient } from '../data'
import { User } from '../data/manageUsersApiClient'

jest.mock('../data/manageUsersApiClient')

const token = 'some token'

describe('User service', () => {
  let manageUsersApiClient: jest.Mocked<ManageUsersApiClient>
  let userService: UserService

  let fakeApi: nock.Scope
  beforeEach(() => {
    config.apis.prisonApi.url = 'http://localhost:8100'
    fakeApi = nock(config.apis.prisonApi.url)
    manageUsersApiClient = new ManageUsersApiClient() as jest.Mocked<ManageUsersApiClient>
  })
  afterEach(() => {
    nock.cleanAll()
  })

  describe('getUser', () => {
    const caseload = {
      caseLoadId: 'MDI',
    } as PrisonApiUserCaseloads

    beforeEach(() => {
      manageUsersApiClient = new ManageUsersApiClient() as jest.Mocked<ManageUsersApiClient>
      userService = new UserService(manageUsersApiClient)
    })

    it('Retrieves and formats user name also has correct caseloads', async () => {
      manageUsersApiClient.getUser.mockResolvedValue({ name: 'anon nobody' } as User)
      fakeApi.get(`/api/users/me/caseLoads`).reply(200, [caseload])

      const result = await userService.getUser(token)

      expect(result.displayName).toEqual('Anon Nobody')
      expect(result.caseloads).toEqual(['MDI'])
    })
    it('Propagates error', async () => {
      manageUsersApiClient.getUser.mockRejectedValue(new Error('some error'))

      await expect(userService.getUser(token)).rejects.toEqual(new Error('some error'))
    })
  })
})

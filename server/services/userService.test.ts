import nock from 'nock'
import UserService from './userService'
import HmppsAuthClient, { User } from '../data/hmppsAuthClient'
import { PrisonApiUserCaseloads } from '../@types/prisonApi/prisonClientTypes'
import config from '../config'

jest.mock('../data/hmppsAuthClient')

const token = 'some token'

describe('User service', () => {
  let hmppsAuthClient: jest.Mocked<HmppsAuthClient>
  let userService: UserService

  let fakeApi: nock.Scope
  beforeEach(() => {
    config.apis.prisonApi.url = 'http://localhost:8100'
    fakeApi = nock(config.apis.prisonApi.url)
    hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
  })
  afterEach(() => {
    nock.cleanAll()
  })

  describe('getUser', () => {
    const caseload = {
      caseLoadId: 'MDI',
    } as PrisonApiUserCaseloads

    beforeEach(() => {
      hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
      userService = new UserService(hmppsAuthClient)
    })

    it('Retrieves and formats user name also has correct caseloads', async () => {
      hmppsAuthClient.getUser.mockResolvedValue({ name: 'anon nobody' } as User)
      fakeApi.get(`/api/users/me/caseLoads`).reply(200, [caseload])

      const result = await userService.getUser(token)

      expect(result.displayName).toEqual('Anon Nobody')
      expect(result.caseloads).toEqual(['MDI'])
    })
    it('Propagates error', async () => {
      hmppsAuthClient.getUser.mockRejectedValue(new Error('some error'))

      await expect(userService.getUser(token)).rejects.toEqual(new Error('some error'))
    })
  })
})

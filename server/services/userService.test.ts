import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import UserService from './userService'
import { PrisonApiUserCaseloads } from '../@types/prisonApi/prisonClientTypes'
import ManageUsersApiClient, { type User } from '../data/manageUsersApiClient'
import createUserToken from '../testutils/createUserToken'
import PrisonerService from './prisonerService'

jest.mock('../data/manageUsersApiClient')
jest.mock('./prisonerService')

describe('User service', () => {
  let manageUsersApiClient: jest.Mocked<ManageUsersApiClient>
  let prisonerService: jest.Mocked<PrisonerService>
  let userService: UserService
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  describe('getUser', () => {
    const caseload = {
      caseLoadId: 'MDI',
    } as PrisonApiUserCaseloads
    beforeEach(() => {
      mockAuthenticationClient = {
        getToken: jest.fn().mockResolvedValue('test-system-token'),
      } as unknown as jest.Mocked<AuthenticationClient>

      manageUsersApiClient = new ManageUsersApiClient(mockAuthenticationClient) as jest.Mocked<ManageUsersApiClient>
      prisonerService = new PrisonerService(null, null) as jest.Mocked<PrisonerService>
      userService = new UserService(manageUsersApiClient, prisonerService)
    })

    it('Retrieves and formats user name', async () => {
      const token = createUserToken([])
      manageUsersApiClient.getUser.mockResolvedValue({ name: 'john smith' } as User)
      prisonerService.getUsersCaseloads.mockResolvedValue([caseload])

      const result = await userService.getUser(token)

      expect(result.displayName).toEqual('John Smith')
      expect(result.caseloads).toEqual(['MDI'])
    })

    it('Retrieves and formats roles', async () => {
      const token = createUserToken(['ROLE_ONE', 'ROLE_TWO'])
      manageUsersApiClient.getUser.mockResolvedValue({ name: 'john smith' } as User)
      prisonerService.getUsersCaseloads.mockResolvedValue([caseload] as PrisonApiUserCaseloads[])

      const result = await userService.getUser(token)

      expect(result.roles).toEqual(['ONE', 'TWO'])
    })

    it('Propagates error', async () => {
      const token = createUserToken([])
      manageUsersApiClient.getUser.mockRejectedValue(new Error('some error'))

      await expect(userService.getUser(token)).rejects.toEqual(new Error('some error'))
    })
  })
})

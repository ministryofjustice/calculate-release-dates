import convertToTitleCase from '../utils/utils'
import PrisonApiClient from '../api/prisonApiClient'
import ManageUsersApiClient, { User } from '../data/manageUsersApiClient'

interface UserDetails extends User {
  displayName: string
  caseloads: string[]
  caseloadDescriptions: string[]
  caseloadMap: Map<string, string>
}

export default class UserService {
  constructor(private readonly manageUsersApiClient: ManageUsersApiClient) {
    // intentionally left blank
  }

  async getUser(token: string): Promise<UserDetails> {
    const user = await this.manageUsersApiClient.getUser(token)
    const userCaseloads = await new PrisonApiClient(token).getUsersCaseloads()
    return {
      ...user,
      displayName: convertToTitleCase(user.name as string),
      caseloads: userCaseloads.map(uc => uc.caseLoadId),
      caseloadDescriptions: userCaseloads.map(uc => uc.description),
      caseloadMap: new Map(userCaseloads.map(uc => [uc.caseLoadId, uc.description])),
    }
  }
}

import convertToTitleCase from '../utils/utils'
import type HmppsAuthClient from '../data/hmppsAuthClient'
import PrisonApiClient from '../api/prisonApiClient'

interface UserDetails {
  name: string
  displayName: string
  caseloads: string[]
  caseloadDescriptions: string[]
}

export default class UserService {
  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {}

  async getUser(token: string): Promise<UserDetails> {
    const user = await this.hmppsAuthClient.getUser(token)
    const userCaseloads = await new PrisonApiClient(token).getUsersCaseloads()
    return {
      ...user,
      displayName: convertToTitleCase(user.name as string),
      caseloads: userCaseloads.map(uc => uc.caseLoadId),
      caseloadDescriptions: userCaseloads.map(uc => uc.description),
    }
  }
}

import { jwtDecode } from 'jwt-decode'
import { convertToTitleCase } from '../utils/utils'
import type { User } from '../data/manageUsersApiClient'
import ManageUsersApiClient from '../data/manageUsersApiClient'
import PrisonerService from './prisonerService'

export interface UserDetails extends User {
  displayName: string | undefined
  roles: string[]
  caseloads: string[]
  caseloadDescriptions: string[]
  caseloadMap: Map<string, string>
  hasAdjustmentsAccess: boolean
  isDigitalSupportUser: boolean
  isSpecialistSupportUser: boolean
}

export default class UserService {
  constructor(
    private readonly manageUsersApiClient: ManageUsersApiClient,
    private readonly prisonerService: PrisonerService,
  ) {}

  async getUser(token: string): Promise<UserDetails> {
    const user = await this.manageUsersApiClient.getUser(token)
    const userCaseloads = await this.prisonerService.getUsersCaseloads(token)
    const roles = this.getUserRoles(token)
    return {
      ...user,
      roles,
      ...(user.name && { displayName: convertToTitleCase(user.name) }),
      caseloads: userCaseloads.map(uc => uc.caseLoadId),
      caseloadDescriptions: userCaseloads.map(uc => uc.description),
      caseloadMap: new Map(userCaseloads.map(uc => [uc.caseLoadId, uc.description])),
      hasAdjustmentsAccess: this.hasAdjustmentsAccess(roles),
      isDigitalSupportUser: roles.includes('COURTCASE_RELEASEDATE_SUPPORT'),
      isSpecialistSupportUser: roles.includes('CRDS_SPECIALIST_SUPPORT'),
    }
  }

  getUserRoles(token: string): string[] {
    const { authorities: roles = [] } = jwtDecode(token) as { authorities?: string[] }
    return roles.map(role => role.substring(role.indexOf('_') + 1))
  }

  hasAdjustmentsAccess(roles: string[]): boolean {
    return roles.includes('ADJUSTMENTS_MAINTAINER')
  }
}

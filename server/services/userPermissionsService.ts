import AuthorisedRoles from '../enumerations/authorisedRoles'

export default class UserPermissionsService {
  public allowBulkLoad(roles: string[]): boolean {
    return (
      roles.includes(AuthorisedRoles.ROLE_RELEASE_DATE_COMPARER) ||
      roles.includes(AuthorisedRoles.ROLE_RELEASE_DATE_MANUAL_COMPARER)
    )
  }

  public allowManualComparison(roles: string[]): boolean {
    return roles.includes(AuthorisedRoles.ROLE_RELEASE_DATE_MANUAL_COMPARER)
  }

  public allowBulkComparison(roles: string[]): boolean {
    return roles.includes(AuthorisedRoles.ROLE_RELEASE_DATE_COMPARER)
  }

  public allowSpecialSupport(roles: string[]): boolean {
    return roles.includes(AuthorisedRoles.ROLE_CRDS_SPECIALIST_SUPPORT)
  }
}

import AuthorisedRoles from '../enumerations/authorisedRoles'

export default class BulkLoadService {
  public allowBulkLoad(roles: string[]) {
    return (
      roles.includes(AuthorisedRoles.ROLE_RELEASE_DATE_COMPARER) ||
      roles.includes(AuthorisedRoles.ROLE_RELEASE_DATE_MANUAL_COMPARER)
    )
  }

  public allowManualComparison(roles: string[]) {
    return roles.includes(AuthorisedRoles.ROLE_RELEASE_DATE_MANUAL_COMPARER)
  }
}

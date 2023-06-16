import { match } from 'path-to-regexp'
import AuthorisedRoles from '../enumerations/authorisedRoles'
import { comparePaths } from '../routes/compareRoutes'

function getMatchPath(path: string) {
  return match(path, { decode: decodeURIComponent })
}

const urlToRoleMapping = {
  [comparePaths.COMPARE_INDEX]: {
    roles: [AuthorisedRoles.ROLE_RELEASE_DATE_COMPARER, AuthorisedRoles.ROLE_RELEASE_DATE_MANUAL_COMPARER],
    matchPath: getMatchPath(comparePaths.COMPARE_INDEX),
  },
  [comparePaths.COMPARE_MANUAL]: {
    roles: [AuthorisedRoles.ROLE_RELEASE_DATE_MANUAL_COMPARER],
    matchPath: getMatchPath(comparePaths.COMPARE_MANUAL),
  },
  [comparePaths.COMPARE_CHOOSE]: {
    roles: [AuthorisedRoles.ROLE_RELEASE_DATE_COMPARER],
    matchPath: getMatchPath(comparePaths.COMPARE_CHOOSE),
  },
}

export default urlToRoleMapping

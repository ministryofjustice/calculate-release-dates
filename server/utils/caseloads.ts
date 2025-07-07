import logger from '../../logger'
import AuthorisedRoles from '../enumerations/authorisedRoles'

export default function deriveAccessibleCaseloads(caseloads: string[], roles: string[]): string[] {
  const derived = [...caseloads, 'TRN']
  logger.info(`deriveAccessibleCaseloads: User roles: ${roles.join(', ')}`)
  if (roles.includes(AuthorisedRoles.ROLE_INACTIVE_BOOKINGS)) {
    derived.push('OUT')
  }
  return derived
}

import logger from '../../logger'

export default function deriveAccessibleCaseloads(caseloads: string[], roles: string[]): string[] {
  const derived = [...caseloads, 'TRN']

  logger.info(`deriveAccessibleCaseloads: User roles: ${roles.join(', ')}`)
  if (roles.includes('INACTIVE_BOOKINGS')) {
    derived.push('OUT')
  }
  return derived
}

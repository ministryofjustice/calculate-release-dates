export default function deriveAccessibleCaseloads(caseloads: string[], roles: string[]): string[] {
  const derived = [...caseloads, 'TRN']
  if (roles.includes('INACTIVE_BOOKINGS') || roles.includes('SST_ROLE_NAME')) {
    derived.push('OUT')
  }
  return derived
}

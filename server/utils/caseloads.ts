export default function deriveAccessibleCaseloads(caseloads: string[], roles: string[]): string[] {
  const derived = [...caseloads, 'TRN']
  if (roles.includes('INACTIVE_BOOKINGS')) {
    derived.push('OUT')
  }
  return derived
}

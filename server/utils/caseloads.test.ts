import deriveAccessibleCaseloads from './caseloads'

describe('deriveAccessibleCaseloads', () => {
  it('includes TRN by default', () => {
    const result = deriveAccessibleCaseloads(['MDI'], [])
    expect(result).toContain('TRN')
  })

  it('includes OUT if user has INACTIVE_BOOKINGS role', () => {
    const result = deriveAccessibleCaseloads(['MDI'], ['INACTIVE_BOOKINGS'])
    expect(result).toContain('OUT')
  })

  it('includes OUT if user has SST_ROLE_NAME role', () => {
    const result = deriveAccessibleCaseloads(['MDI'], ['SST_ROLE_NAME'])
    expect(result).toContain('OUT')
  })

  it('includes both TRN and OUT if user has both roles', () => {
    const result = deriveAccessibleCaseloads(['LEI'], ['INACTIVE_BOOKINGS', 'SST_ROLE_NAME'])
    expect(result).toEqual(expect.arrayContaining(['TRN', 'OUT']))
  })

  it('includes only TRN if neither role is present', () => {
    const result = deriveAccessibleCaseloads(['LEI'], ['VIEW_PRISONERS'])
    expect(result).toEqual(expect.arrayContaining(['LEI', 'TRN']))
    expect(result).not.toContain('OUT')
  })

  it('handles empty caseloads correctly', () => {
    const result = deriveAccessibleCaseloads([], ['SST_ROLE_NAME'])
    expect(result).toEqual(expect.arrayContaining(['TRN', 'OUT']))
  })

  it('preserves original caseloads and appends additional ones', () => {
    const result = deriveAccessibleCaseloads(['LEI', 'MDI'], ['INACTIVE_BOOKINGS'])
    expect(result).toEqual(expect.arrayContaining(['LEI', 'MDI', 'TRN', 'OUT']))
  })
})

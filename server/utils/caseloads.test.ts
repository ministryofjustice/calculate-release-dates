import deriveAccessibleCaseloads from './caseloads'
import AuthorisedRoles from '../enumerations/authorisedRoles'

describe('deriveAccessibleCaseloads', () => {
  it('includes TRN by default', () => {
    const result = deriveAccessibleCaseloads(['MDI'], [])
    expect(result).toEqual(expect.arrayContaining(['MDI', 'TRN']))
  })

  it('includes OUT if user has INACTIVE_BOOKINGS role', () => {
    const result = deriveAccessibleCaseloads(['MDI'], [AuthorisedRoles.ROLE_INACTIVE_BOOKINGS])
    expect(result).toEqual(expect.arrayContaining(['MDI', 'TRN', 'OUT']))
  })

  it('does not include OUT if user does not have INACTIVE_BOOKINGS role', () => {
    const result = deriveAccessibleCaseloads(['MDI'], ['SOME_OTHER_ROLE'])
    expect(result).toEqual(expect.not.arrayContaining(['OUT']))
  })
})

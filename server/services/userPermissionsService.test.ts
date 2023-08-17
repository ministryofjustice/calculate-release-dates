import UserPermissionsService from './userPermissionsService'
import AuthorisedRoles from '../enumerations/authorisedRoles'

const userPermissionsService = new UserPermissionsService()
describe('calculatePreliminaryReleaseDates', () => {
  it('Test that people with no roles is invalid', async () => {
    const isAllowed = userPermissionsService.allowBulkLoad([])
    expect(isAllowed).toBeFalsy()
  })

  it('Test that people with no valid roles is invalid', async () => {
    const isAllowed = userPermissionsService.allowBulkLoad(['NOT_A_VALID_BULK_ROLE'])
    expect(isAllowed).toBeFalsy()
  })

  it('Test that people with RELEASE_DATE_COMPARER role are valid', async () => {
    const isAllowed = userPermissionsService.allowBulkLoad([AuthorisedRoles.ROLE_RELEASE_DATE_COMPARER])
    expect(isAllowed).toBeTruthy()
  })

  it('Test that people with ROLE_RELEASE_DATE_MANUAL_COMPARER role are valid', async () => {
    const isAllowed = userPermissionsService.allowBulkLoad([AuthorisedRoles.ROLE_RELEASE_DATE_MANUAL_COMPARER])
    expect(isAllowed).toBeTruthy()
  })

  it('Test that people with both ROLE_RELEASE_DATE_MANUAL_COMPARER role are valid', async () => {
    const isAllowed = userPermissionsService.allowBulkLoad([
      AuthorisedRoles.ROLE_RELEASE_DATE_MANUAL_COMPARER,
      AuthorisedRoles.ROLE_RELEASE_DATE_COMPARER,
    ])
    expect(isAllowed).toBeTruthy()
  })

  it('Test that people with no roles is invalid', async () => {
    const isAllowed = userPermissionsService.allowManualComparison([])
    expect(isAllowed).toBeFalsy()
  })

  it('Test that people with no valid roles is invalid', async () => {
    const isAllowed = userPermissionsService.allowManualComparison(['NOT_A_VALID_BULK_ROLE'])
    expect(isAllowed).toBeFalsy()
  })

  it('Test that people with RELEASE_DATE_COMPARER role are invalid', async () => {
    const isAllowed = userPermissionsService.allowManualComparison([AuthorisedRoles.ROLE_RELEASE_DATE_COMPARER])
    expect(isAllowed).toBeFalsy()
  })

  it('Test that people with ROLE_RELEASE_DATE_MANUAL_COMPARER role are valid', async () => {
    const isAllowed = userPermissionsService.allowManualComparison([AuthorisedRoles.ROLE_RELEASE_DATE_MANUAL_COMPARER])
    expect(isAllowed).toBeTruthy()
  })
  it('Test that people with ROLE_CRDS_SPECIALIST_SUPPORT role are valid', async () => {
    const isAllowed = userPermissionsService.allowSpecialSupport([AuthorisedRoles.ROLE_CRDS_SPECIALIST_SUPPORT])
    expect(isAllowed).toBeTruthy()
  })
})

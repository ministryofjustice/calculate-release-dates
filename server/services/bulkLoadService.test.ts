import BulkLoadService from './bulkLoadService'
import AuthorisedRoles from '../enumerations/authorisedRoles'

const bulkLoadService = new BulkLoadService()
describe('calculatePreliminaryReleaseDates', () => {
  it('Test that people with no roles is invalid', async () => {
    const isAllowed = bulkLoadService.allowBulkLoad([])
    expect(isAllowed).toBeFalsy()
  })

  it('Test that people with no valid roles is invalid', async () => {
    const isAllowed = bulkLoadService.allowBulkLoad(['NOT_A_VALID_BULK_ROLE'])
    expect(isAllowed).toBeFalsy()
  })

  it('Test that people with RELEASE_DATE_COMPARER role are valid', async () => {
    const isAllowed = bulkLoadService.allowBulkLoad([AuthorisedRoles.ROLE_RELEASE_DATE_COMPARER])
    expect(isAllowed).toBeTruthy()
  })

  it('Test that people with ROLE_RELEASE_DATE_MANUAL_COMPARER role are valid', async () => {
    const isAllowed = bulkLoadService.allowBulkLoad([AuthorisedRoles.ROLE_RELEASE_DATE_MANUAL_COMPARER])
    expect(isAllowed).toBeTruthy()
  })

  it('Test that people with both ROLE_RELEASE_DATE_MANUAL_COMPARER role are valid', async () => {
    const isAllowed = bulkLoadService.allowBulkLoad([
      AuthorisedRoles.ROLE_RELEASE_DATE_MANUAL_COMPARER,
      AuthorisedRoles.ROLE_RELEASE_DATE_COMPARER,
    ])
    expect(isAllowed).toBeTruthy()
  })

  it('Test that people with no roles is invalid', async () => {
    const isAllowed = bulkLoadService.allowManualComparison([])
    expect(isAllowed).toBeFalsy()
  })

  it('Test that people with no valid roles is invalid', async () => {
    const isAllowed = bulkLoadService.allowManualComparison(['NOT_A_VALID_BULK_ROLE'])
    expect(isAllowed).toBeFalsy()
  })

  it('Test that people with RELEASE_DATE_COMPARER role are invalid', async () => {
    const isAllowed = bulkLoadService.allowManualComparison([AuthorisedRoles.ROLE_RELEASE_DATE_COMPARER])
    expect(isAllowed).toBeFalsy()
  })

  it('Test that people with ROLE_RELEASE_DATE_MANUAL_COMPARER role are valid', async () => {
    const isAllowed = bulkLoadService.allowManualComparison([AuthorisedRoles.ROLE_RELEASE_DATE_MANUAL_COMPARER])
    expect(isAllowed).toBeTruthy()
  })
})

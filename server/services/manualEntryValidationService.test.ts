import ManualEntryValidationService from './manualEntryValidationService'

const underTest = new ManualEntryValidationService()
describe('Manual Entry Validation', () => {
  it('Should return an empty string if no pairs supplied', () => {
    const msg = underTest.validatePairs([])
    expect(msg).toBeUndefined()
  })
  it('Should return an empty string if null pairs supplied', () => {
    const msg = underTest.validatePairs(null)
    expect(msg).toBeUndefined()
  })
  it('Should return a validation string if a pair found', () => {
    const msg = underTest.validatePairs(['ARD', 'CRD'])
    expect(msg).toBe(
      '<div class="govuk-error-message">The following release dates cannot be selected together:<ul><li>CRD and ARD</li></ul>You must re-select the dates, or if you need help, <a href="mailto:omu.specialistsupportteam@justice.gov.uk?subject=Calculate%20release%20dates%20-%20Manual%20Entry%20-%20Incompatible%20Dates">contact the Specialist support team</a> for support.</div>',
    )
  })
  it('Should return undefined if there are no matches', () => {
    const msg = underTest.validatePairs(['ARD'])
    expect(msg).toBeUndefined()
  })
  it('Should show all pairs if there are more than one', () => {
    const msg = underTest.validatePairs(['ARD', 'CRD', 'HDCED', 'HDCAD', 'PRRD', 'PED', 'APD'])
    expect(msg).toBe(
      '<div class="govuk-error-message">The following release dates cannot be selected together:<ul><li>CRD and ARD</li>\n<li>HDCED and PRRD</li>\n<li>HDCAD and PRRD</li>\n<li>PED and PRRD</li>\n<li>HDCED and PED</li>\n<li>HDCAD and PED</li>\n<li>HDCAD and APD</li></ul>You must re-select the dates, or if you need help, <a href="mailto:omu.specialistsupportteam@justice.gov.uk?subject=Calculate%20release%20dates%20-%20Manual%20Entry%20-%20Incompatible%20Dates">contact the Specialist support team</a> for support.</div>',
    )
  })
})

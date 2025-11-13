import CommonSelectDatesToEnterPage from './commonSelectDatesToEnterPage'

export default class GenuineOverridesSelectDatesToEnterPage extends CommonSelectDatesToEnterPage {
  constructor() {
    super('genuine-override-select-dates')
  }

  public clickCancel(): GenuineOverridesSelectDatesToEnterPage {
    cy.get('[data-qa=cancel-link]').click()
    return this
  }

  public clickBack(): GenuineOverridesSelectDatesToEnterPage {
    cy.get('.govuk-back-link').click()
    return this
  }
}

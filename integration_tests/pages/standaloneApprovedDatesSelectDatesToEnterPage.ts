import CommonSelectDatesToEnterPage from './commonSelectDatesToEnterPage'

export default class StandaloneApprovedDatesSelectDatesToEnterPage extends CommonSelectDatesToEnterPage {
  constructor() {
    super('select-approved-dates')
  }

  public clickCancel(): StandaloneApprovedDatesSelectDatesToEnterPage {
    cy.get('[data-qa=cancel-link]').click()
    return this
  }

  public clickBack(): StandaloneApprovedDatesSelectDatesToEnterPage {
    cy.get('.govuk-back-link').click()
    return this
  }
}

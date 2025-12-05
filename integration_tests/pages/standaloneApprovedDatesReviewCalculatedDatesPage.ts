import Page from './page'

export default class StandaloneApprovedDatesReviewCalculatedDatesPage extends Page {
  constructor() {
    super('approved-dates-review-calculated-dates')
  }

  public clickContinue(): StandaloneApprovedDatesReviewCalculatedDatesPage {
    cy.get('[data-qa=confirm-and-continue]').click()
    return this
  }

  public clickCancel(): StandaloneApprovedDatesReviewCalculatedDatesPage {
    cy.get('[data-qa=cancel-link]').click()
    return this
  }

  public clickBack(): StandaloneApprovedDatesReviewCalculatedDatesPage {
    cy.get('.govuk-back-link').click()
    return this
  }
}

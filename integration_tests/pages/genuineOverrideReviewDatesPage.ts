import Page, { PageElement } from './page'

export default class GenuineOverrideReviewDatesPage extends Page {
  constructor() {
    super('genuine-override-review-dates')
  }

  public continueButton(): PageElement {
    return cy.get('[data-qa=confirm-and-save]')
  }

  public cancel(): PageElement {
    return cy.get('[data-qa=cancel-link]')
  }
}

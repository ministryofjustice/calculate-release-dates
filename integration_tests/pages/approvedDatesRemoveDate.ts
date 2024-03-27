import Page, { PageElement } from './page'

export default class ApprovedDatesRemoveDatePage extends Page {
  constructor() {
    super('remove-approved-date')
  }

  public yes(): PageElement {
    return cy.get('#remove-date')
  }

  public continue(): PageElement {
    return cy.get('[data-qa=remove-date]')
  }
}

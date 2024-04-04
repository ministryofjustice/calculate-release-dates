import Page, { PageElement } from './page'

export default class ManualDatesRemoveDatePage extends Page {
  constructor() {
    super('manual-dates-remove-date')
  }

  public yes(): PageElement {
    return cy.get('#remove-date')
  }

  public continue(): PageElement {
    return cy.get('[data-qa=remove-date]')
  }
}

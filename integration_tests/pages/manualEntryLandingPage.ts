import Page, { PageElement } from './page'

export default class ManualEntryLandingPage extends Page {
  constructor() {
    super('manual-entry-start')
  }

  public continue(): PageElement {
    return cy.get('[data-qa=manual-calc-start]')
  }
}

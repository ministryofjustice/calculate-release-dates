export type PageElement = Cypress.Chainable<JQuery>

export default abstract class Page {
  static verifyOnPage<T>(constructor: new (...args: unknown[]) => T, ...args: unknown[]): T {
    return new constructor(args)
  }

  constructor(private readonly pageId: string) {
    this.checkOnPage()
  }

  checkOnPage(): void {
    cy.get(`#${this.pageId}`).should('exist')
  }

  signOut = (): PageElement => cy.get('[data-qa=signOut]')

  errorSummary = (): PageElement => cy.get('.govuk-error-summary')

  manageDetails = (): PageElement => cy.get('[data-qa=manageDetails]')
}

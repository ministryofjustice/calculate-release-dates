export type PageElement = Cypress.Chainable<JQuery>

export default abstract class Page {
  static verifyOnPage<T>(constructor: new () => T): T {
    return new constructor()
  }

  constructor(private readonly pageId: string) {
    this.checkOnPage()
  }

  checkOnPage(): void {
    cy.get(`#${this.pageId}`).should('exist')
  }

  signOut = (): PageElement => cy.get('[data-qa=logout]')

  errorSummary = (): PageElement => cy.get('.govuk-error-summary')
}

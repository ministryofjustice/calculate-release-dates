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

  hasMiniProfile(): void {
    cy.get(`[data-qa=mini-profile-name]`).should('contain.text', 'Marvin Haggler')
    cy.get(`[data-qa=mini-profile-dob]`).should('contain.text', '03 February 1965')
    cy.get(`[data-qa=mini-profile-offender-no]`).should('contain.text', 'A1234AB')
    cy.get(`[data-qa=mini-profile-establishment]`).should('contain.text', 'Foo Prison (HMP)')
    cy.get(`[data-qa=mini-profile-location]`).should('contain.text', 'D-2-003')
  }

  signOut = (): PageElement => cy.get('[data-qa=signOut]')

  errorSummary = (): PageElement => cy.get('.govuk-error-summary')

  manageDetails = (): PageElement => cy.get('[data-qa=manageDetails]')
}

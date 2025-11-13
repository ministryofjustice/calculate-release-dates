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
    cy.get('[data-qa=mini-profile-person-profile-link]').should('contain.text', 'Haggler, Marvin')
    cy.get('[data-qa=mini-profile-dob]').should('contain.text', '03/02/1965')
    cy.get('[data-qa=mini-profile-prisoner-number]').should('contain.text', 'A1234AB')
    cy.get('[data-qa=mini-profile-prison-name]').should('contain.text', 'Foo Prison (HMP)')
    cy.get('[data-qa=mini-profile-cell-location]').should('contain.text', 'D-2-003')
    cy.get('[data-qa=mini-profile-status]').should('contain.text', 'Some Status')
  }

  signOut = (): PageElement => cy.get('[data-qa=signOut]')

  errorSummary = (): PageElement => cy.get('.govuk-error-summary')

  get errorSummaryItems(): PageElement {
    return this.errorSummary().find('.govuk-error-summary__list a')
  }

  hasMissingOffenceDates(flag: boolean): PageElement {
    const check = flag ? 'exist' : 'not.exist'
    return cy
      .get('p')
      .contains('This service cannot calculate release dates because the offence start date is missing.')
      .should(check)
  }

  hasMissingOffenceTerms(flag: boolean): PageElement {
    const check = flag ? 'exist' : 'not.exist'
    return cy
      .get('p')
      .contains('This service cannot calculate release dates because the offence is missing imprisonment terms.')
      .should(check)
  }

  hasMissingOffenceLicenceTerms(flag: boolean): PageElement {
    const check = flag ? 'exist' : 'not.exist'
    return cy
      .get('p')
      .contains('This service cannot calculate release dates because the offence is missing a licence code.')
      .should(check)
  }
}

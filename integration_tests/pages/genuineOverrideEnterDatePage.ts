import Page, { PageElement } from './page'

export default class GenuineOverrideEnterDatePage extends Page {
  constructor() {
    super('genuine-override-enter-dates')
  }

  public checkIsFor(fullDateString: string) {
    const expected = `Enter the ${fullDateString}`
    cy.get('.govuk-fieldset__heading').should('contain.text', expected)
  }

  public enterDate(day: string, month: string, year: string) {
    cy.get(`#day`).type(day)
    cy.get(`#month`).type(month)
    cy.get(`#year`).type(year)
  }

  public backButton(): PageElement {
    return cy.get('.govuk-back-link')
  }

  public continue(): PageElement {
    return cy.get('[data-qa=continue-button]')
  }
}

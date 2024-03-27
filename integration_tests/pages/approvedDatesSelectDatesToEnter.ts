import Page, { PageElement } from './page'

export default class ApprovedDatesSelectDatesToEnterPage extends Page {
  constructor() {
    super('select-approved-date-types')
  }

  public expectDateOffered(expected: string[]) {
    cy.get('.govuk-checkboxes__input')
      .then($els => Cypress._.map($els, 'value'))
      .should('deep.equal', expected)
  }

  public continue(): PageElement {
    return cy.get('[data-qa=manual-entry]')
  }

  public checkDate(type: string) {
    cy.get('.govuk-checkboxes__input').then($els =>
      Cypress._.each($els, e => {
        if (e.getAttribute('value') === type) {
          e.click()
        }
      }),
    )
  }
}

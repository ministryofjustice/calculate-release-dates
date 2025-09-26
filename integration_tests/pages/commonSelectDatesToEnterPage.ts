import Page, { PageElement } from './page'

export default class CommonSelectDatesToEnterPage extends Page {
  constructor(pageId: string) {
    super(pageId)
  }

  public expectDateOffered(expected: string[]) {
    cy.get('.govuk-checkboxes__input')
      .then($els => Cypress._.map($els, 'value'))
      .should('deep.equal', expected)
  }

  public expectDateToBeUnavailable(type: string) {
    cy.get(`[data-qa=checkbox-${type}]`).should('be.checked').should('be.disabled')
  }

  public uncheckDate(type: string) {
    cy.get(`[data-qa=checkbox-${type}]`).uncheck()
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

  public continue(buttonDataQa: string = 'manual-entry'): PageElement {
    return cy.get(`[data-qa=${buttonDataQa}]`)
  }
}

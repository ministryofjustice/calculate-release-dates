import Page, { PageElement } from './page'

export default class CommonSelectDatesToEnterPage extends Page {
  constructor(pageId: string) {
    super(pageId)
  }

  public expectDateOffered(expected: string[]): CommonSelectDatesToEnterPage {
    cy.get('.govuk-checkboxes__input')
      .then($els => Cypress._.map($els, 'value'))
      .should('deep.equal', expected)
    return this
  }

  public expectDateToBeUnavailable(type: string): CommonSelectDatesToEnterPage {
    cy.get(`[data-qa=checkbox-${type}]`).should('be.checked').should('be.disabled')
    return this
  }

  public uncheckDate(type: string): CommonSelectDatesToEnterPage {
    cy.get(`[data-qa=checkbox-${type}]`).uncheck()
    return this
  }

  public checkDate(type: string): CommonSelectDatesToEnterPage {
    cy.get('.govuk-checkboxes__input').then($els =>
      Cypress._.each($els, e => {
        if (e.getAttribute('value') === type) {
          e.click()
        }
      }),
    )
    return this
  }

  public continue(buttonDataQa: string = 'manual-entry'): PageElement {
    return cy.get(`[data-qa=${buttonDataQa}]`)
  }
}

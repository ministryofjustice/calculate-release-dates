import Page, { PageElement } from './page'

export default class ApprovedDatesEnterDatePage extends Page {
  constructor() {
    super('enter-approved-date')
  }

  public checkIsFor(fullDateString: string) {
    const expected = `Enter the ${fullDateString}`
    cy.get('.govuk-fieldset__heading').should('contain.text', expected)
  }

  public enterDate(type: string, day: string, month: string, year: string) {
    cy.get(`#${type}-day`).type(day)
    cy.get(`#${type}-month`).type(month)
    cy.get(`#${type}-year`).type(year)
  }

  public clearDate(type: string) {
    cy.get(`#${type}-day`).clear()
    cy.get(`#${type}-month`).clear()
    cy.get(`#${type}-year`).clear()
  }

  public continue(): PageElement {
    return cy.get('[data-qa=date-entry]')
  }
}

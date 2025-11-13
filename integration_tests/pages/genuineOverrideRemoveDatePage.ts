import Page, { PageElement } from './page'

export default class GenuineOverrideRemoveDatePage extends Page {
  constructor() {
    super('genuine-override-delete-date')
  }

  public checkIsFor(fullDateString: string): GenuineOverrideRemoveDatePage {
    const expected = `Are you sure you want to delete ${fullDateString}`
    cy.get('.govuk-fieldset__heading').should('contain.text', expected)
    return this
  }

  public selectRadio(option: string): GenuineOverrideRemoveDatePage {
    cy.get(`[data-qa=confirm-remove-date-${option}]`).click()
    return this
  }

  public continue(): PageElement {
    return cy.get('[data-qa=continue-button]')
  }

  public clickCancel(): GenuineOverrideRemoveDatePage {
    cy.get('[data-qa=cancel-link]').click()
    return this
  }
}

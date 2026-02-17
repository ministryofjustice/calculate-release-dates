import Page, { PageElement } from './page'

export default class StandaloneRemoveApprovedDatePage extends Page {
  constructor() {
    super('delete-approved-date')
  }

  public checkIsFor(fullDateString: string): StandaloneRemoveApprovedDatePage {
    const expected = `Are you sure you want to delete ${fullDateString}`
    cy.get('.govuk-fieldset__heading').should('contain.text', expected)
    return this
  }

  public selectRadio(option: string): StandaloneRemoveApprovedDatePage {
    cy.get(`[data-qa=confirm-remove-date-${option}]`).click()
    return this
  }

  public continue(): PageElement {
    return cy.get('[data-qa=continue-button]')
  }

  public clickCancel(): StandaloneRemoveApprovedDatePage {
    cy.get('[data-qa=cancel-link]').click()
    return this
  }
}

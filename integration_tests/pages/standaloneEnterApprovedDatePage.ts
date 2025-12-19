import Page from './page'

export default class StandaloneEnterApprovedDatePage extends Page {
  constructor() {
    super('enter-approved-date')
  }

  public checkIsFor(fullDateString: string): StandaloneEnterApprovedDatePage {
    const expected = `Enter the ${fullDateString}`
    cy.get('.govuk-fieldset__heading').should('contain.text', expected)
    return this
  }

  public hasDate(day: string, month: string, year: string): StandaloneEnterApprovedDatePage {
    cy.get(`#day`).should('have.value', day)
    cy.get(`#month`).should('have.value', month)
    cy.get(`#year`).should('have.value', year)
    return this
  }

  public clearDate(): StandaloneEnterApprovedDatePage {
    cy.get(`#day`).clear()
    cy.get(`#month`).clear()
    cy.get(`#year`).clear()
    return this
  }

  public enterDate(day: string, month: string, year: string): StandaloneEnterApprovedDatePage {
    cy.get(`#day`).type(day)
    cy.get(`#month`).type(month)
    cy.get(`#year`).type(year)
    return this
  }

  public clickBack(): StandaloneEnterApprovedDatePage {
    cy.get('.govuk-back-link').click()
    return this
  }

  public clickContinue(): StandaloneEnterApprovedDatePage {
    cy.get('[data-qa=continue-button]').click()
    return this
  }

  public clickCancel(): StandaloneEnterApprovedDatePage {
    cy.get('[data-qa=cancel-link]').click()
    return this
  }
}

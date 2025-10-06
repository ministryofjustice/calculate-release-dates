import Page from './page'

export default class GenuineOverrideEnterDatePage extends Page {
  constructor() {
    super('genuine-override-enter-dates')
  }

  public checkIsFor(fullDateString: string): GenuineOverrideEnterDatePage {
    const expected = `Enter the ${fullDateString}`
    cy.get('.govuk-fieldset__heading').should('contain.text', expected)
    return this
  }

  public hasDate(day: string, month: string, year: string): GenuineOverrideEnterDatePage {
    cy.get(`#day`).should('have.value', day)
    cy.get(`#month`).should('have.value', month)
    cy.get(`#year`).should('have.value', year)
    return this
  }

  public clearDate(): GenuineOverrideEnterDatePage {
    cy.get(`#day`).clear()
    cy.get(`#month`).clear()
    cy.get(`#year`).clear()
    return this
  }

  public enterDate(day: string, month: string, year: string): GenuineOverrideEnterDatePage {
    cy.get(`#day`).type(day)
    cy.get(`#month`).type(month)
    cy.get(`#year`).type(year)
    return this
  }

  public clickBack(): GenuineOverrideEnterDatePage {
    cy.get('.govuk-back-link').click()
    return this
  }

  public clickContinue(): GenuineOverrideEnterDatePage {
    cy.get('[data-qa=continue-button]').click()
    return this
  }
}

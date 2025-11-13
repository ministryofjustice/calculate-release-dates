import Page from './page'

export default class GenuineOverrideExpressInterceptPage extends Page {
  constructor() {
    super('genuine-override-express-intercept')
  }

  public hasReason(reason: string): GenuineOverrideExpressInterceptPage {
    cy.get('[data-qa=previous-reason]').should('contain.text', reason)
    return this
  }

  public clickContinue(): GenuineOverrideExpressInterceptPage {
    cy.get('[data-qa=continue]').click()
    return this
  }

  public clickCancel(): GenuineOverrideExpressInterceptPage {
    cy.get('[data-qa=cancel-link]').click()
    return this
  }

  public clickBack(): GenuineOverrideExpressInterceptPage {
    cy.get('.govuk-back-link').click()
    return this
  }
}

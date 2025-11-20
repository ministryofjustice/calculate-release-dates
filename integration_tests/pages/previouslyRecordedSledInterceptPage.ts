import Page from './page'

export default class PreviouslyRecordedSledInterceptPage extends Page {
  constructor() {
    super('previously-recorded-sled-intercept')
  }

  public selectRadio(code: string): PreviouslyRecordedSledInterceptPage {
    cy.get(`[data-qa=use-previously-recorded-SLED-${code}]`).check()
    return this
  }

  public clickContinue(): PreviouslyRecordedSledInterceptPage {
    cy.get('[data-qa=continue]').click()
    return this
  }

  public clickCancel(): PreviouslyRecordedSledInterceptPage {
    cy.get('[data-qa=cancel-link]').click()
    return this
  }

  public clickBack(): PreviouslyRecordedSledInterceptPage {
    cy.get('.govuk-back-link').click()
    return this
  }
}

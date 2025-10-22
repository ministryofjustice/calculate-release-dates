import Page from './page'

export default class GenuineOverrideReviewPreviousOverridePage extends Page {
  constructor() {
    super('genuine-override-review-previous-override')
  }

  public selectRadio(code: string): GenuineOverrideReviewPreviousOverridePage {
    cy.get(`[data-qa=still-correct-dates-${code}]`).check()
    return this
  }

  public clickContinue(): GenuineOverrideReviewPreviousOverridePage {
    cy.get('[data-qa=continue]').click()
    return this
  }

  public clickCancel(): GenuineOverrideReviewPreviousOverridePage {
    cy.get('[data-qa=cancel-link]').click()
    return this
  }

  public clickBack(): GenuineOverrideReviewPreviousOverridePage {
    cy.get('.govuk-back-link').click()
    return this
  }
}

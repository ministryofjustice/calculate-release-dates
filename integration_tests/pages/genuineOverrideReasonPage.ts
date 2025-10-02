import Page from './page'

export default class GenuineOverrideReasonPage extends Page {
  constructor() {
    super('genuine-override-reason')
  }

  public selectRadio(code: string): GenuineOverrideReasonPage {
    cy.get(`[data-qa=reasonRadio-${code}]`).check()
    return this
  }

  public enterReasonFurtherDetail(furtherDetail: string): GenuineOverrideReasonPage {
    cy.get(`#reason-further-detail`).type(furtherDetail)
    return this
  }

  public clickContinue(): GenuineOverrideReasonPage {
    cy.get('[data-qa=submitGenuineOverrideReason]').click()
    return this
  }

  public clickCancel(): GenuineOverrideReasonPage {
    cy.get('[data-qa=cancel-link]').click()
    return this
  }
}

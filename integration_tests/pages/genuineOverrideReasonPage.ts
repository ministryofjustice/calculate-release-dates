import Page, { PageElement } from './page'

export default class GenuineOverrideReasonPage extends Page {
  constructor() {
    super('genuine-override-reason')
  }

  public radioByCode(code: string): PageElement {
    return cy.get(`[data-qa=reasonRadio-${code}]`)
  }

  public reasonFurtherDetail(): PageElement {
    return cy.get(`#reason-further-detail`)
  }

  public continueButton(): PageElement {
    return cy.get('[data-qa=submitGenuineOverrideReason]')
  }

  public cancel(): PageElement {
    return cy.get('[data-qa=cancel-link]')
  }
}

import Page, { PageElement } from './page'

export default class CancelQuestionPage extends Page {
  constructor() {
    super('cancelQuestion')
  }

  public noOption(): PageElement {
    return cy.get('input[value="no"]')
  }

  public clickNo(): CancelQuestionPage {
    this.noOption().check()
    return this
  }

  public yesOption(): PageElement {
    return cy.get('input[value="yes"]')
  }

  public clickYes(): CancelQuestionPage {
    this.yesOption().check()
    return this
  }

  public confirm(): PageElement {
    return cy.get(`[data-qa=confirm]`)
  }

  public clickConfirm(): CancelQuestionPage {
    this.confirm().click()
    return this
  }
}

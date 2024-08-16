import Page, { PageElement } from './page'

export default class ApprovedDatesQuestionPage extends Page {
  constructor() {
    super('cancelQuestion')
  }

  public noOption(): PageElement {
    return cy.get('input[value="no"]')
  }

  public yesOption(): PageElement {
    return cy.get('input[value="yes"]')
  }

  public confirm(): PageElement {
    return cy.get(`[data-qa=confirm]`)
  }
}

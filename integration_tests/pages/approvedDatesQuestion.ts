import Page, { PageElement } from './page'

export default class ApprovedDatesQuestionPage extends Page {
  constructor() {
    super('approved-dates-question')
  }

  public static goTo(prisonerId: string, calculationRequestId: string): ApprovedDatesQuestionPage {
    cy.visit(`/calculation/${prisonerId}/${calculationRequestId}/approved-dates-question`)
    return new ApprovedDatesQuestionPage()
  }

  public no(): PageElement {
    return cy.get('#approvedDatesQuestion-2')
  }

  public yes(): PageElement {
    return cy.get('#approvedDatesQuestion')
  }

  public continue(): PageElement {
    return cy.get('[data-qa=approved-dates-question]')
  }

  public cancel(): PageElement {
    return cy.get('[data-qa=cancel-link]')
  }
}

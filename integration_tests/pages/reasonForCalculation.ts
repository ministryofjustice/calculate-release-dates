import Page, { PageElement } from './page'

export default class CalculationReasonPage extends Page {
  constructor() {
    super(`reason`)
  }

  public static goTo(prisonerId: string): CalculationReasonPage {
    cy.visit(`/calculation/${prisonerId}/reason`)
    return new CalculationReasonPage()
  }

  public radioByReasonId(reasonId: number): PageElement {
    return cy.get(`[data-qa=reasonRadio-${reasonId}]`)
  }

  public furtherDetailByReasonId(reasonId: number): PageElement {
    return cy.get(`#reason-further-detail-${reasonId}`)
  }

  public submitReason(): PageElement {
    return cy.get(`[data-qa=submitReason]`)
  }

  headerUserName(): PageElement {
    return cy.get('[data-qa=header-user-name]')
  }
}

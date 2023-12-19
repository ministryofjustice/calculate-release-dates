import Page, { PageElement } from './page'

export default class CalculationReasonPage extends Page {
  constructor() {
    super(`reason`)
  }

  public static goTo(prisonerId: string): CalculationReasonPage {
    cy.visit(`/calculation/${prisonerId}/reason`)
    return new CalculationReasonPage()
  }

  public radioByIndex(index: number): PageElement {
    return cy.get(`[data-qa=reasonRadio-${index}]`)
  }

  public submitReason(): PageElement {
    return cy.get(`[data-qa=submitReason]`)
  }
}

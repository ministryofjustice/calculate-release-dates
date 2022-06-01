import Page, { PageElement } from './page'

export default class CalculationQuestionPage extends Page {
  constructor() {
    super('calculation-questions')
  }

  public static goTo(prisonerId: string): CalculationQuestionPage {
    cy.visit(`/calculation/${prisonerId}/pre-calculation-questions`)
    return new CalculationQuestionPage()
  }

  public sentenceTable(caseSequence: number): PageElement {
    return cy.get(`[data-qa=${caseSequence}-sentence-table]`)
  }

  public selectAllCheckbox(): PageElement {
    return cy.get(`#select-all`)
  }

  public checkboxByIndex(index: number): PageElement {
    return cy.get(`.row-checkbox:eq(${index})`)
  }

  public continueButton(): PageElement {
    return cy.get(`[data-qa=submit-user-input]`)
  }
}

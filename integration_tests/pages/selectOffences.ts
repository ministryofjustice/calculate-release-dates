import Page, { PageElement } from './page'

export default class SelectOffencesPage extends Page {
  constructor(list: string) {
    super(`select-offences-${list}`)
  }

  public static goTo(prisonerId: string, list: string): SelectOffencesPage {
    cy.visit(`/calculation/${prisonerId}/select-offences-that-appear-in-${list}`)
    return new SelectOffencesPage(list)
  }

  public offenceListLink(): PageElement {
    return cy.get(`[data-qa=offence-list-link]`)
  }

  public sentenceTable(caseSequence: number): PageElement {
    return cy.get(`[data-qa=${caseSequence}-sentence-table]`)
  }

  public checkboxByIndex(index: number): PageElement {
    return cy.get(`.row-checkbox:eq(${index})`)
  }

  public noneSelectedCheckbox(): PageElement {
    return cy.get('#unselect-all')
  }

  public continueButton(): PageElement {
    return cy.get(`[data-qa=submit-user-input]`)
  }

  public backLink(): PageElement {
    return cy.get(`[data-qa=backlink]`)
  }
}

import Page, { PageElement } from './page'

export default class CheckInformationPage extends Page {
  constructor() {
    super('check-information')
  }

  public static goTo(prisonerId: string): CheckInformationPage {
    cy.visit(`/calculation/${prisonerId}/check-information`)
    return new CheckInformationPage()
  }

  public offenceCountText(): PageElement {
    return cy.get('#offence-count-text')
  }

  public calculateButton(): PageElement {
    return cy.get('[data-qa=calculate-release-dates]')
  }

  public sentenceTable(caseSequence: number): PageElement {
    return cy.get(`[data-qa=${caseSequence}-sentence-table]`)
  }
}

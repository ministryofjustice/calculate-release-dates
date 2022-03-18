import Page, { PageElement } from './page'

export default class ViewSentencesAndOffencesCommon extends Page {
  public offenceCountText(): PageElement {
    return cy.get('#offence-count-text')
  }

  public sentenceTable(caseSequence: number): PageElement {
    return cy.get(`[data-qa=${caseSequence}-sentence-table]`)
  }

  public caseNumber(caseSequence: number): PageElement {
    return cy.get(`[data-qa=${caseSequence}-case-number]`)
  }
}

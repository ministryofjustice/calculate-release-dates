import Page, { PageElement } from './page'

export default class ViewSentencesAndOffencesCommon extends Page {
  public offenceCountText(): PageElement {
    return cy.get('#offence-count-text')
  }

  public sentenceTable(caseSequence: number): PageElement {
    return cy.get(`[data-qa=${caseSequence}-sentence-table]`)
  }

  public adjustmentSummaryTabLink(): PageElement {
    return cy.get(`[data-qa=summary-tab-link]`)
  }

  public adjustmentSummary(): PageElement {
    return cy.get(`#summary`)
  }

  public adjustmentDetailedTabLink(): PageElement {
    return cy.get(`[data-qa=detailed-tab-link]`)
  }

  public adjustmentDetailed(): PageElement {
    return cy.get(`#detailed`)
  }
}

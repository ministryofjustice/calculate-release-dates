import Page, { PageElement } from './page'

export default class ViewSentencesAndOffencesCommon extends Page {
  public offenceCountText(): PageElement {
    return cy.get('#offence-count-text')
  }

  public sentenceCards(caseSequence: number): PageElement {
    return cy.get(`[data-qa=${caseSequence}-sentence-cards]`)
  }

  public caseNumber(caseSequence: number): PageElement {
    return cy.get(`[data-qa=${caseSequence}-case-number]`)
  }

  public adjustmentSummaryTabLink(): PageElement {
    return cy.get(`[data-qa=summary-tab-link]`)
  }

  public offenceTitle(offenceCode: string): PageElement {
    return cy.get(`[data-qa=${offenceCode}-title]`)
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

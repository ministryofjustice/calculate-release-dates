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

  public offenceTitle(offenceCode: string): PageElement {
    return cy.get(`[data-qa=${offenceCode}-title]`)
  }

  public remandTable(): PageElement {
    return cy.get(`[data-qa=remand-table]`)
  }
}

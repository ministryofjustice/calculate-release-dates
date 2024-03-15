import Page, { PageElement } from './page'

export default class CalculationSummaryCommon extends Page {
  public sledDate = (): PageElement => cy.get('[data-qa=SLED-date]')

  public crdDate = (): PageElement => cy.get('[data-qa=CRD-date]')

  public crdHints = (index: number): PageElement => cy.get(`[data-qa=CRD-release-date-hint-${index}]`)

  public hdcedDate = (): PageElement => cy.get('[data-qa=HDCED-date]')

  public hdcedWeekendHint = (index: number): PageElement => cy.get(`[data-qa=HDCED-release-date-hint-${index}]`)

  public concurrentSentenceTable = (): PageElement => cy.get('[data-qa=concurrent-sentence-table]')

  public consecutiveStartDate = (): PageElement => cy.get('[data-qa=consecutive-start-date]')

  public consecutiveSentenceTable = (): PageElement => cy.get('[data-qa=consecutive-sentence-table]')

  public consecutiveDatesTable = (): PageElement => cy.get('[data-qa=consecutive-dates-table]')

  public releaseDatesAdjustmentsTable = (): PageElement => cy.get('[data-qa=release-dates-adjustments-table]')
}

import Page, { PageElement } from './page'

export default class CalculationSummaryCommon extends Page {
  public sledDate = (): PageElement => cy.get('[data-qa=SLED-date]')

  public crdDate = (): PageElement => cy.get('[data-qa=CRD-date]')

  public crdWeekendAdjustment = (): PageElement => cy.get('[data-qa=CRD-weekend-adjustment]')

  public hdcedDate = (): PageElement => cy.get('[data-qa=HDCED-date]')

  public hdcedWeekendAdjustment = (): PageElement => cy.get('[data-qa=HDCED-weekend-adjustment]')

  public concurrentSentenceTable = (): PageElement => cy.get('[data-qa=concurrent-sentence-table]')

  public consecutiveStartDate = (): PageElement => cy.get('[data-qa=consecutive-start-date]')

  public consecutiveSentenceTable = (): PageElement => cy.get('[data-qa=consecutive-sentence-table]')

  public consecutiveDatesTable = (): PageElement => cy.get('[data-qa=consecutive-dates-table]')

  public releaseDatesAdjustmentsTable = (): PageElement => cy.get('[data-qa=release-dates-adjustments-table]')
}

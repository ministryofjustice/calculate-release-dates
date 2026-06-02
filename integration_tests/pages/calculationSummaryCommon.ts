import Page, { PageElement } from './page'

export default class CalculationSummaryCommon extends Page {
  public sledDate = (): PageElement => cy.get('[data-qa=SLED-date]')

  public crdDate = (): PageElement => cy.get('[data-qa=CRD-date]')

  public crdHints = (index: number): PageElement => cy.get(`[data-qa=CRD-release-date-hint-${index}]`)

  public hdcedDate = (): PageElement => cy.get('[data-qa=HDCED-date]')

  public hdcedWeekendHint = (index: number): PageElement => cy.get(`[data-qa=HDCED-release-date-hint-${index}]`)
}

import Page, { PageElement } from './page'

export default class CalculationSummaryPage extends Page {
  constructor() {
    super('calculation-summary')
  }

  public static goTo(prisonerId: string, calculationRequestId: string): CalculationSummaryPage {
    cy.visit(`/calculation/${prisonerId}/summary/${calculationRequestId}`)
    return new CalculationSummaryPage()
  }

  public sledDate = (): PageElement => cy.get('[data-qa=SLED-date]')

  public crdDate = (): PageElement => cy.get('[data-qa=CRD-date]')

  public crdWeekendAdjustment = (): PageElement => cy.get('[data-qa=CRD-weekend-adjustment]')

  public hdcedDate = (): PageElement => cy.get('[data-qa=HDCED-date]')

  public hdcedWeekendAdjustment = (): PageElement => cy.get('[data-qa=HDCED-weekend-adjustment]')

  public submitToNomisButton = (): PageElement => cy.get('[data-qa=submit-to-nomis]')
}

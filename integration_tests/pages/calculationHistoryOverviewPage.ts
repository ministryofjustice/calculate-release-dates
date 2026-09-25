import Page from './page'

export default class CalculationHistoryOverviewPage extends Page {
  constructor() {
    super('calculation-history-overview')
  }

  public clickPrintNotificationSlip(): CalculationHistoryOverviewPage {
    cy.get('[data-qa=print-notification-slip]').click()
    return this
  }

  public clickRecordACounterCheck(): CalculationHistoryOverviewPage {
    cy.get('[data-qa=record-counter-check]').click()
    return this
  }

  public clickOlderCalculations(): CalculationHistoryOverviewPage {
    cy.get('[data-qa=older-calculations-link]').click()
    return this
  }

  public clickNewerCalculations(): CalculationHistoryOverviewPage {
    cy.get('[data-qa=newer-calculations-link]').click()
    return this
  }

  public shouldBeShowingItems(expected: string): CalculationHistoryOverviewPage {
    cy.get(`[data-qa=current-items-hint]`).should('contain.text', expected)
    return this
  }

  public clickBack(): CalculationHistoryOverviewPage {
    cy.get('.govuk-back-link').click()
    return this
  }
}

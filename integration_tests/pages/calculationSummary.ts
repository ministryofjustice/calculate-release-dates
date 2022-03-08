import CalculationSummaryCommon from './calculationSummaryCommon'
import { PageElement } from './page'

export default class CalculationSummaryPage extends CalculationSummaryCommon {
  constructor() {
    super('calculation-summary')
  }

  public static goTo(
    prisonerId: string,
    calculationRequestId: string,
    failOnStatusCode?: boolean
  ): CalculationSummaryPage {
    this.visit(prisonerId, calculationRequestId, failOnStatusCode)
    return new CalculationSummaryPage()
  }

  public static visit(prisonerId: string, calculationRequestId: string, failOnStatusCode?: boolean): void {
    cy.visit(`/calculation/${prisonerId}/summary/${calculationRequestId}`, {
      failOnStatusCode: failOnStatusCode !== false,
    })
  }

  public submitToNomisButton = (): PageElement => cy.get('[data-qa=submit-to-nomis]')
}

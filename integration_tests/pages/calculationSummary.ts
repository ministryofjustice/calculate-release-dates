import CalculationSummaryCommon from './calculationSummaryCommon'
import { PageElement } from './page'

export default class CalculationSummaryPage extends CalculationSummaryCommon {
  constructor() {
    super('calculation-summary')
  }

  public static goTo(prisonerId: string, calculationRequestId: string): CalculationSummaryPage {
    cy.visit(`/calculation/${prisonerId}/summary/${calculationRequestId}`)
    return new CalculationSummaryPage()
  }

  public submitToNomisButton = (): PageElement => cy.get('[data-qa=submit-to-nomis]')
}

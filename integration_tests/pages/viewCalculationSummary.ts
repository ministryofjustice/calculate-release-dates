import CalculationSummaryCommon from './calculationSummaryCommon'
import { PageElement } from './page'

export default class ViewCalculationSummary extends CalculationSummaryCommon {
  constructor() {
    super('view-calculation-summary')
  }

  public static goTo(calculationRequestId: string): ViewCalculationSummary {
    cy.visit(`/view/${calculationRequestId}/calculation-summary`)
    return new ViewCalculationSummary()
  }

  public previousPage(): PageElement {
    return cy.get('[data-qa=previous-page-button]')
  }
}

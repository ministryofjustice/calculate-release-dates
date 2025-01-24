import CalculationSummaryCommon from './calculationSummaryCommon'
import { PageElement } from './page'

export default class ViewCalculationSummary extends CalculationSummaryCommon {
  constructor() {
    super('view-calculation-summary')
  }

  public static goTo(nomsId: string, calculationRequestId: string): ViewCalculationSummary {
    cy.visit(`/view/${nomsId}/calculation-summary/${calculationRequestId}`)
    return new ViewCalculationSummary()
  }

  public loadSentenceAndOffences(): PageElement {
    return cy.get('[data-qa=sub-nav-sent-and-off]')
  }

  public getCRDDateHintText(): PageElement {
    return cy.get('[data-qa=CRD-release-date-hint-1]')
  }
}

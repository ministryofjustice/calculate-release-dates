import Page from './page'

export default class CalculationCompletePage extends Page {
  constructor() {
    super('calculation-complete')
  }

  public static goTo(prisonerId: string, calculationRequestId: string): CalculationCompletePage {
    cy.visit(`/calculation/${prisonerId}/complete/${calculationRequestId}`)
    return new CalculationCompletePage()
  }
}

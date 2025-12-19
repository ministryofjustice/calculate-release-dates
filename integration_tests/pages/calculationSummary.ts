import CalculationSummaryCommon from './calculationSummaryCommon'
import { PageElement } from './page'

export default class CalculationSummaryPage extends CalculationSummaryCommon {
  constructor() {
    super('calculation-summary')
  }

  public static goTo(
    prisonerId: string,
    calculationRequestId: string,
    failOnStatusCode?: boolean,
  ): CalculationSummaryPage {
    this.visit(prisonerId, calculationRequestId, failOnStatusCode)
    return new CalculationSummaryPage()
  }

  public static visit(prisonerId: string, calculationRequestId: string, failOnStatusCode?: boolean): void {
    cy.visit(`/calculation/${prisonerId}/summary/${calculationRequestId}`, {
      failOnStatusCode: failOnStatusCode !== false,
    })
  }

  public dateShouldHaveValue(type: string, expected: string) {
    cy.get(`[data-qa=${type}-date]`).should('contain.text', expected)
  }

  public dateShouldNotBePresent(type: string) {
    cy.get(`[data-qa=${type}-date]`).should('not.exist')
  }

  public crdDateShouldNotNotBePresent(date: string) {
    cy.get(`[data-qa=${date}-date]`).should('not.contain.text', 'Manually overridden')
  }

  public changeDateLink(type: string): PageElement {
    return cy.get(`[data-qa=change-approved-${type}-link]`)
  }

  public removeDateLink(type: string): PageElement {
    return cy.get(`[data-qa=remove-approved-${type}-link]`)
  }

  public agreeWithDatesRadio(option: string): PageElement {
    return cy.get(`[data-qa=agree-with-dates-${option}]`)
  }

  public frt56TrancheNotification = (): PageElement => cy.get('.ftr56-tranche-guidance-panel')

  public submitToNomisButton = (): PageElement => cy.get('[data-qa=submit-to-nomis]')

  public continueButton = (): PageElement => cy.get('[data-qa=continue-button]')

  public clickBack(): CalculationSummaryPage {
    cy.get('.govuk-back-link').click()
    return this
  }
}

import Page, { PageElement } from './page'

export default class CCARDLandingPage extends Page {
  constructor() {
    super('ccard-index')
  }

  public static goTo(prisonerId: string): CCARDLandingPage {
    cy.visit(`/?prisonId=${prisonerId}`)
    return new CCARDLandingPage()
  }

  navigateToSentenceDetailsAction(): PageElement {
    return cy.get('[data-qa=ccard-sentence-details-link]')
  }

  calculateReleaseDatesAction(): PageElement {
    return cy.get('[data-qa=calc-release-dates-for-prisoner-action-link]')
  }

  latestCalculationDate(): PageElement {
    return cy.get('[data-qa=calculation-summary-date]')
  }

  latestCalculationReason(): PageElement {
    return cy.get('[data-qa=calculation-summary-reason]')
  }

  latestCalculationEstablishment(): PageElement {
    return cy.get('[data-qa=calculation-summary-establishment]')
  }

  latestCalculationSource(): PageElement {
    return cy.get('[data-qa=calculation-summary-source]')
  }

  addReleaseDatesAction(): PageElement {
    return cy.get('[data-qa=calc-release-dates-for-adding-dates-link]')
  }
}

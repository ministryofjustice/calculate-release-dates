import Page, { PageElement } from './page'

export default class CCARDLandingPage extends Page {
  constructor() {
    super('ccard-index')
  }

  public static goTo(prisonerId: string): CCARDLandingPage {
    cy.visit(`/?prisonId=${prisonerId}`)
    return new CCARDLandingPage()
  }

  calculateReleaseDatesAction(): PageElement {
    return cy.get('[data-qa=calc-release-dates-for-prisoner-action-link]')
  }

  addReleaseDatesAction(): PageElement {
    return cy.get('[data-qa=calc-release-dates-for-adding-dates-link]')
  }

  latestCalcViewDetailsAction(): PageElement {
    return cy.get('[data-qa=latest-calc-card-action]')
  }
}

import Page, { PageElement } from './page'

export default class PrisonerOverviewPage extends Page {
  constructor() {
    super('prisoner-calculation-overview')
  }

  public static goTo(prisonerId: string): PrisonerOverviewPage {
    cy.visit(`/${prisonerId}/overview`)
    return new PrisonerOverviewPage()
  }

  navigateToCalculationDetailsLink(): PageElement {
    return cy.get('[data-qa=view-calculation-details-link]')
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

  latestCalculationCalculatedBy(): PageElement {
    return cy.get('[data-qa=calculation-summary-calculated-by]')
  }

  latestCalculationCheckedBy(): PageElement {
    return cy.get('[data-qa=calculation-summary-checked-by]')
  }

  latestCalculationSource(): PageElement {
    return cy.get('[data-qa=calculation-summary-source]')
  }

  addReleaseDatesAction(): PageElement {
    return cy.get('[data-qa=calc-release-dates-for-adding-dates-link]')
  }

  recordSecondCheckAction(): PageElement {
    return cy.get('[data-qa=calc-release-dates-for-prisoner-second-check]')
  }

  headerPhaseBanner(): PageElement {
    return cy.get('[data-qa=header-phase-banner]')
  }

  headerUserName(): PageElement {
    return cy.get('[data-qa=header-user-name]')
  }

  commonComponentsHeader(): PageElement {
    return cy.get('[data-qa=common-header]')
  }

  designLibraryFooter(): PageElement {
    return cy.get('[data-qa=ccrds-footer]')
  }
}

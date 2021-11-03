import Page, { PageElement } from './page'

export default class PrisonerSearchPage extends Page {
  constructor() {
    super('prisoner-search')
  }

  public static goTo(): PrisonerSearchPage {
    cy.visit(`/search/prisoners`)
    return new PrisonerSearchPage()
  }

  public searchForFirstName(firstName: string): void {
    this.prisonerFirstName().type(firstName)
    this.prisonerSearch().click()
  }

  public checkPrisonerInResults(fullName: string, identifer: string): void {
    this.prisonerResultsTable().within(() => {
      cy.get(`[data-qa=prisoner-${identifer}]`).within(() => {
        cy.get(`a:contains(${fullName})`).should('exist')
      })
    })
  }

  private prisonerFirstName = (): PageElement => cy.get('[data-qa=prisoner-first-name]')

  private prisonerLastName = (): PageElement => cy.get('[data-qa=prisoner-last-name]')

  private prisonerIdentifier = (): PageElement => cy.get('[data-qa=prisoner-identifer]')

  private prisonerSearch = (): PageElement => cy.get('[data-qa=search-prisoners]')

  private prisonerResultsTable = (): PageElement => cy.get('[data-qa=search-results-table]')
}

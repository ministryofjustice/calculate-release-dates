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

  public checkNomisInformationButtonForPrisoner = (prisonerIdentifier: string): PageElement =>
    cy
      .get('[data-qa=search-results-table]')
      .find(`[data-qa=prisoner-${prisonerIdentifier}]`)
      .find('[data-qa=prisoner-link]')

  private prisonerFirstName = (): PageElement => cy.get('[data-qa=prisoner-first-name]')

  private prisonerLastName = (): PageElement => cy.get('[data-qa=prisoner-last-name]')

  private prisonerIdentifier = (): PageElement => cy.get('[data-qa=prisoner-identifier]')

  private prisonerSearch = (): PageElement => cy.get('[data-qa=search-prisoners]')
}

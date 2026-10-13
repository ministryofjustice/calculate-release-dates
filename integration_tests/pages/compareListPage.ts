import Page, { PageElement } from './page'

export default class CompareListPage extends Page {
  constructor() {
    super('compare')
  }

  paginationNav = (): PageElement => cy.get('.govuk-pagination')

  paginationItems = (): PageElement => cy.get('.govuk-pagination__item')

  currentPaginationItem = (): PageElement => cy.get('.govuk-pagination__item--current')

  paginationLinkForPage = (page: number) => cy.get('.govuk-pagination__item').contains('a', page.toString())

  previousLink = (): PageElement => cy.get('.govuk-pagination__prev')

  nextLink = (): PageElement => cy.get('.govuk-pagination__next')

  resultsText = (): PageElement => cy.get('.moj-pagination__results')

  comparisonItems = (): PageElement => cy.get('.gem-c-document-list__item')

  prisonSelect = (): PageElement => cy.get('#prison-name')

  filterButton = (): PageElement => cy.get('.govuk-button--primary')

  yourComparisonsNavLink = (): PageElement => cy.get('.govuk-service-navigation__item a').contains('Your Comparisons')

  othersComparisonsNavLink = (): PageElement =>
    cy.get('.govuk-service-navigation__item a').contains("Other's Comparisons")

  clickPaginationPage(page: number): CompareListPage {
    this.paginationLinkForPage(page).click()
    return this
  }

  clickNext(): CompareListPage {
    this.nextLink().find('a').click()
    return this
  }

  clickPrevious(): CompareListPage {
    this.previousLink().find('a').click()
    return this
  }
}

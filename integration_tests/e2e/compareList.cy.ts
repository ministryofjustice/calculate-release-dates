import AuthorisedRoles from '../../server/enumerations/authorisedRoles'
import {
  ComparisonSummary,
  PageComparisonSummary,
} from '../../server/@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import Page from '../pages/page'
import CompareListPage from '../pages/compareListPage'

const buildComparison = (index: number, prison = 'MDI'): ComparisonSummary => ({
  comparisonShortReference: `ref-${index}`,
  prison,
  comparisonType: 'ESTABLISHMENT_FULL',
  comparisonStatus: 'COMPLETED',
  calculatedAt: '2024-03-05T10:00:00',
  calculatedByUsername: 'USER1',
  numberOfMismatches: 1,
  numberOfPeopleExpected: 10,
  numberOfPeopleCompared: 10,
  numberOfPeopleComparisonFailedFor: 0,
  comparisonProgress: {
    percentageComplete: 100,
  },
})

const buildPage = (opts: {
  pageNumber: number
  totalElements: number
  size?: number
  prison?: string
}): PageComparisonSummary => {
  const size = opts.size ?? 10
  const totalPages = Math.ceil(opts.totalElements / size)
  const start = opts.pageNumber * size
  const numberOfElements = Math.max(0, Math.min(size, opts.totalElements - start))
  const content = Array.from({ length: numberOfElements }, (_, i) => buildComparison(start + i, opts.prison))
  return {
    content,
    page: {
      size,
      number: opts.pageNumber,
      totalElements: opts.totalElements,
      totalPages,
    },
  }
}

context('Compare list pagination', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', [AuthorisedRoles.ROLE_RELEASE_DATE_COMPARER])
    cy.task('stubManageUser')
    cy.task('stubGetUserCaseloads')
    cy.task('stubComponents')
  })

  it('shows page number links and marks the current page when there are multiple pages', () => {
    cy.task('stubSearchComparisons', {
      calculatedByCurrentUser: true,
      page: 1,
      size: 10,
      response: buildPage({ pageNumber: 1, totalElements: 25 }),
    })

    cy.signIn({ failOnStatusCode: false, returnUrl: '/compare/list?page=2' })

    const page = Page.verifyOnPage(CompareListPage)
    page.paginationNav().should('exist')
    page.paginationItems().should('have.length', 3)
    page.currentPaginationItem().should('contain.text', '2')
    page.previousLink().should('exist')
    page.nextLink().should('exist')
    page.resultsText().should('contain.text', 'Showing 11 to 20 of 25 total comparisons')
    page.comparisonItems().should('have.length', 10)
  })

  it('navigates to the next and previous page using the pagination links', () => {
    cy.task('stubSearchComparisons', {
      calculatedByCurrentUser: true,
      page: 0,
      size: 10,
      response: buildPage({ pageNumber: 0, totalElements: 25 }),
    })
    cy.task('stubSearchComparisons', {
      calculatedByCurrentUser: true,
      page: 1,
      size: 10,
      response: buildPage({ pageNumber: 1, totalElements: 25 }),
    })

    cy.signIn({ failOnStatusCode: false, returnUrl: '/compare/list' })

    const page = Page.verifyOnPage(CompareListPage)
    page.previousLink().should('not.exist')
    page.resultsText().should('contain.text', 'Showing 1 to 10 of 25 total comparisons')

    page.clickNext()

    cy.url().should('include', '/compare/list?page=2')
    Page.verifyOnPage(CompareListPage)
    cy.get('.moj-pagination__results').should('contain.text', 'Showing 11 to 20 of 25 total comparisons')
    cy.get('.govuk-pagination__item--current').should('contain.text', '2')
  })

  it('does not show pagination when all results fit on a single page', () => {
    cy.task('stubSearchComparisons', {
      calculatedByCurrentUser: true,
      page: 0,
      size: 10,
      response: buildPage({ pageNumber: 0, totalElements: 5 }),
    })

    cy.signIn({ failOnStatusCode: false, returnUrl: '/compare/list' })

    const page = Page.verifyOnPage(CompareListPage)
    page.paginationNav().should('not.exist')
    page.comparisonItems().should('have.length', 5)
  })

  it('preserves the selected prison filter in pagination links', () => {
    cy.task('stubSearchComparisons', {
      calculatedByCurrentUser: true,
      prison: 'MDI',
      page: 0,
      size: 10,
      response: buildPage({ pageNumber: 0, totalElements: 25, prison: 'MDI' }),
    })

    cy.signIn({ failOnStatusCode: false, returnUrl: '/compare/list?prisonName=MDI' })

    const page = Page.verifyOnPage(CompareListPage)
    page.paginationLinkForPage(2).should('have.attr', 'href').and('include', 'prisonName=MDI')
    page.nextLink().find('a').should('have.attr', 'href').and('include', 'prisonName=MDI')
  })

  it("shows other users' comparisons on the others page using calculatedByCurrentUser=false", () => {
    cy.task('stubSearchComparisons', {
      calculatedByCurrentUser: false,
      page: 1,
      size: 10,
      response: buildPage({ pageNumber: 1, totalElements: 15 }),
    })

    cy.signIn({ failOnStatusCode: false, returnUrl: '/compare/list/others?page=2' })

    const page = Page.verifyOnPage(CompareListPage)
    page.paginationNav().should('exist')
    page.currentPaginationItem().should('contain.text', '2')
    page.resultsText().should('contain.text', 'Showing 11 to 15 of 15 total comparisons')
    page.nextLink().should('not.exist')
  })
})

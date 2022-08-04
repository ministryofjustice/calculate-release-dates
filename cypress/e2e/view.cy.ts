import IndexPage from '../../integration_tests/pages'
import ErrorPage from '../../integration_tests/pages/error'
import Page from '../../integration_tests/pages/page'
import PrisonerSearchPage from '../../integration_tests/pages/prisonerSearch'

context('View journey tests', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubPrisonerSearch')
    cy.task('stubGetUserCaseloads')
    cy.task('stubGetPrisonerDetails')
    cy.task('stubCalculationUserInputs')
  })

  it('View journey search for prisoner without calculation submitted', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.viewJourneyLink().click()

    const prisonerSearchPage = Page.verifyOnPage(PrisonerSearchPage)
    prisonerSearchPage.searchForFirstName('Marvin')
    prisonerSearchPage.prisonerLinkFor('A1234AB').click()
    const errorPage = Page.verifyOnPage(ErrorPage)
    errorPage.heading().contains('No calculation submitted')
  })
})

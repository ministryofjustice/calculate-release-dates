import Page from '../pages/page'
import PrisonerSearchPage from '../pages/prisonerSearch'
import ErrorPage from '../pages/error'

context('Error tests', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubPrisonerSearch')
    cy.task('stubGetUserOtherCaseloads')
    cy.task('stubGetPrisonerDetails')
    cy.task('stubComponents')
  })

  it('prisoner not in caseload shows error page', () => {
    cy.signIn({ failOnStatusCode: false })

    const prisonerSearchPage = Page.verifyOnPage(PrisonerSearchPage)
    prisonerSearchPage.searchForFirstName('Marvin')
    prisonerSearchPage.prisonerLinkFor('A1234AB').click()

    const errorPage = Page.verifyOnPage(ErrorPage)
    errorPage.hasMiniProfile()
    errorPage.heading().should('contain.text', 'The details for this person cannot be found')
  })
})

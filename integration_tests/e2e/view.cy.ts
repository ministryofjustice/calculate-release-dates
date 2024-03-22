import Page from '../pages/page'
import PrisonerSearchPage from '../pages/prisonerSearch'
import CCARDLandingPage from '../pages/CCARDLandingPage'

context('View journey tests', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubPrisonerSearch')
    cy.task('stubGetUserCaseloads')
    cy.task('stubGetPrisonerDetails')
    cy.task('stubCalculationUserInputs')
    cy.task('stubComponents')
    cy.task('stubGetLatestCalculationNone')
    cy.task('stubGetCalculationHistoryNone')
  })

  it('View journey search for prisoner without calculation submitted', () => {
    cy.signIn()

    const prisonerSearchPage = Page.verifyOnPage(PrisonerSearchPage)
    prisonerSearchPage.searchForFirstName('Marvin')
    prisonerSearchPage.prisonerLinkFor('A1234AB').click()

    const ccardLandingPage = Page.verifyOnPage(CCARDLandingPage)
    ccardLandingPage.hasMiniProfile()
    ccardLandingPage.latestCalcViewDetailsAction().should('not.exist')
    ccardLandingPage.calculateReleaseDatesAction().should('exist')
  })
})

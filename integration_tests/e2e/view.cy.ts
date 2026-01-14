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
    cy.task('stubGetCalculationHistoryNone')
    cy.task('stubHasNoIndeterminateSentences')
    cy.task('stubGetServiceDefinitions')
  })

  it('View journey search for prisoner without calculation submitted', () => {
    cy.task('stubGetLatestCalculationNone')
    cy.signIn()

    const prisonerSearchPage = Page.verifyOnPage(PrisonerSearchPage)
    prisonerSearchPage.searchForFirstName('Marvin')
    prisonerSearchPage.prisonerLinkFor('A1234AB').click()

    const ccardLandingPage = Page.verifyOnPage(CCARDLandingPage)
    ccardLandingPage.hasMiniProfile()
    ccardLandingPage.calculateReleaseDatesAction().should('exist')
    ccardLandingPage.hasMissingOffenceDates(false)
    ccardLandingPage.hasMissingOffenceTerms(false)
    ccardLandingPage.hasMissingOffenceLicenceTerms(false)
  })
})

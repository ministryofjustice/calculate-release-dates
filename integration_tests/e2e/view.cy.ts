import Page from '../pages/page'
import CCARDLandingPage from '../pages/CCARDLandingPage'

context('View journey tests', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
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
    cy.signIn({ failOnStatusCode: false, returnUrl: '/prisonId=A1234AB' })

    CCARDLandingPage.goTo('A1234AB')

    const ccardLandingPage = Page.verifyOnPage(CCARDLandingPage)
    ccardLandingPage.hasMiniProfile()
    ccardLandingPage.calculateReleaseDatesAction().should('exist')
    ccardLandingPage.hasMissingOffenceDates(false)
    ccardLandingPage.hasMissingOffenceTerms(false)
    ccardLandingPage.hasMissingOffenceLicenceTerms(false)
  })
})

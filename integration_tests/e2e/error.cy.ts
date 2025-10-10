import Page from '../pages/page'
import ErrorPage from '../pages/error'

context('Error tests', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetUserOtherCaseloads')
    cy.task('stubGetPrisonerDetails')
    cy.task('stubGetSentencesAndOffences')
    cy.task('stubGetCalculationResults')
    cy.task('stubGetCalculationBreakdown')
    cy.task('stubSentencesAndOffences')
    cy.task('stubPrisonerDetails')
    cy.task('stubLatestCalculation')
    cy.task('stubSupportedValidationNoMessages')
    cy.task('stubGetActiveCalculationReasons')
    cy.task('stubGetCalculationHistory')
    cy.task('stubGetDetailedCalculationResults')
    cy.task('stubGetLatestCalculation')
    cy.task('stubHasNoIndeterminateSentences')
    cy.task('stubGetServiceDefinitions')
    cy.task('stubGetEligibility')
  })

  it('prisoner not in caseload shows error page', () => {
    cy.signIn({ failOnStatusCode: false, returnUrl: '/?prisonId=A1234AB' })
    const errorPage = Page.verifyOnPage(ErrorPage)
    errorPage.hasMiniProfile()
    errorPage.heading().should('contain.text', 'The details for this person cannot be found')
  })
})

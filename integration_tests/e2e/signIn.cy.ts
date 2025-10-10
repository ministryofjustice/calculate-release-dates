import AuthSignInPage from '../pages/authSignIn'
import Page from '../pages/page'
import CCARDLandingPage from '../pages/CCARDLandingPage'
import CalculationReasonPage from '../pages/reasonForCalculation'

context('Sign In', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetUserCaseloads')
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

  it('Unauthenticated user directed to auth', () => {
    cy.visit('/prisonId=A1234AB')
    Page.verifyOnPage(AuthSignInPage)
  })

  it('Unauthenticated user navigating to sign in page directed to auth', () => {
    cy.visit('/sign-in')
    Page.verifyOnPage(AuthSignInPage)
  })

  it('User name visible in header', () => {
    cy.signIn({ failOnStatusCode: false, returnUrl: '/?prisonId=A1234AB' })

    CalculationReasonPage.goTo('A1234AB')
    const calculationReasonPage = CalculationReasonPage.verifyOnPage(CalculationReasonPage)
    calculationReasonPage.headerUserName().should('contain.text', 'J. Smith')
  })

  it('Phase banner visible in header', () => {
    cy.signIn({ failOnStatusCode: false, returnUrl: '/?prisonId=A1234AB' })
    const landingPage = CCARDLandingPage.goTo('A1234AB')
    landingPage.headerPhaseBanner().should('contain.text', 'dev')
  })

  it('User can sign out', () => {
    cy.signIn({ failOnStatusCode: false, returnUrl: '/?prisonId=A1234AB' })
    const landingPage = CCARDLandingPage.goTo('A1234AB')

    landingPage.signOut().click()
    Page.verifyOnPage(AuthSignInPage)
  })

  it('Token verification failure takes user to sign in page', () => {
    cy.signIn({ failOnStatusCode: false, returnUrl: '/?prisonId=A1234AB' })
    cy.task('stubVerifyToken', false)

    // can't do a visit here as cypress requires only one domain
    cy.request('/prisonId=A1234AB').its('body').should('contain', 'Sign in')
  })

  it('Token verification failure clears user session', () => {
    cy.task('stubComponentsFail')
    cy.signIn({ failOnStatusCode: false, returnUrl: '/?prisonId=A1234AB' })
    cy.task('stubVerifyToken', false)

    cy.request('/?prisonId=A1234AB').its('body').should('contain', 'Sign in')

    cy.task('stubVerifyToken', true)
    cy.task('stubManageUser', 'bobby brown')
    cy.signIn({ failOnStatusCode: false, returnUrl: '/?prisonId=A1234AB' })

    const landingPage = CCARDLandingPage.goTo('A1234AB')
    landingPage.headerUserName().contains('B. Brown')
  })

  it('common components header is displayed', () => {
    cy.task('stubComponents')
    cy.signIn({ failOnStatusCode: false, returnUrl: '/?prisonId=A1234AB' })
    const landingPage = CCARDLandingPage.goTo('A1234AB')
    landingPage.commonComponentsHeader().should('exist')
  })

  it('design library footer is displayed', () => {
    cy.task('stubComponents')
    cy.signIn({ failOnStatusCode: false, returnUrl: '/?prisonId=A1234AB' })
    const landingPage = CCARDLandingPage.goTo('A1234AB')
    landingPage.designLibraryFooter().should('exist')
  })
})

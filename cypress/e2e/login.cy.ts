import IndexPage from '../../integration_tests/pages/index'
import AuthSignInPage from '../../integration_tests/pages/authSignIn'
import Page from '../../integration_tests/pages/page'

context('SignIn', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubGetUserCaseloads')
  })

  it('Unauthenticated user directed to auth', () => {
    cy.visit('/')
    Page.verifyOnPage(AuthSignInPage)
  })

  it('User name visible in header', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.headerUserName().should('contain.text', 'J. Smith')
    indexPage.startNowButton().should('exist')
  })

  it('Page is accessible', () => {
    cy.signIn()
    cy.injectAxe()
    cy.checkA11y()
  })

  it('User can log out', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.signOut().click()
    Page.verifyOnPage(AuthSignInPage)
  })
})

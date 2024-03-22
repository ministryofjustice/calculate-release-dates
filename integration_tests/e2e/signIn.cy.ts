import AuthSignInPage from '../pages/authSignIn'
import Page from '../pages/page'
import PrisonerSearchPage from '../pages/prisonerSearch'

context('Sign In', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetUserCaseloads')
    cy.task('stubComponentsFail')
  })

  it('Unauthenticated user directed to auth', () => {
    cy.visit('/')
    Page.verifyOnPage(AuthSignInPage)
  })

  it('Unauthenticated user navigating to sign in page directed to auth', () => {
    cy.visit('/sign-in')
    Page.verifyOnPage(AuthSignInPage)
  })

  it('User name visible in header', () => {
    cy.signIn()
    const prisonerSearchPage = Page.verifyOnPage(PrisonerSearchPage)
    prisonerSearchPage.headerUserName().should('contain.text', 'J. Smith')
  })

  it('Phase banner visible in header', () => {
    cy.signIn()
    const prisonerSearchPage = Page.verifyOnPage(PrisonerSearchPage)
    prisonerSearchPage.headerPhaseBanner().should('contain.text', 'dev')
  })

  it('User can sign out', () => {
    cy.signIn()
    const prisonerSearchPage = Page.verifyOnPage(PrisonerSearchPage)
    prisonerSearchPage.signOut().click()
    Page.verifyOnPage(AuthSignInPage)
  })

  it('Token verification failure takes user to sign in page', () => {
    cy.signIn()
    Page.verifyOnPage(PrisonerSearchPage)
    cy.task('stubVerifyToken', false)

    // can't do a visit here as cypress requires only one domain
    cy.request('/').its('body').should('contain', 'Sign in')
  })

  it('Token verification failure clears user session', () => {
    cy.signIn()
    const prisonerSearchPage = Page.verifyOnPage(PrisonerSearchPage)
    cy.task('stubVerifyToken', false)

    // can't do a visit here as cypress requires only one domain
    cy.request('/').its('body').should('contain', 'Sign in')

    cy.task('stubVerifyToken', true)
    cy.task('stubManageUser', 'bobby brown')
    cy.signIn()

    prisonerSearchPage.headerUserName().contains('B. Brown')
  })

  it('common components header is displayed', () => {
    cy.task('stubComponents')
    cy.signIn()
    const prisonerSearchPage = Page.verifyOnPage(PrisonerSearchPage)
    prisonerSearchPage.commonComponentsHeader().should('exist')
  })

  it('design library footer is displayed', () => {
    cy.task('stubComponents')
    cy.signIn()
    const prisonerSearchPage = Page.verifyOnPage(PrisonerSearchPage)
    prisonerSearchPage.designLibraryFooter().should('exist')
  })
})

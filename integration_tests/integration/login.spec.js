const IndexPage = require('../pages/index')
const AuthLoginPage = require('../pages/authLogin')

context('Login', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubAuthUser')
  })

  it('Unauthenticated user directed to auth', () => {
    cy.visit('/')
    AuthLoginPage.verifyOnPage()
  })
  it('User is taken to landing page and the content is correct', () => {
    cy.login()
    const landingPage = IndexPage.verifyOnPage()
    landingPage.headerUserName().should('contain.text', 'J. Smith')
    landingPage.mainHeading().should('contain.text', 'Calculate release dates')
    landingPage.startNowButton().click()
    cy.url().should('match', new RegExp(`.+/search/prisoners$`))
  })

  // Only checking critical accessibility issues. Will re-visit
  it('Page is accessible', () => {
    cy.login()
    cy.injectAxe()
    cy.checkA11y(null, {
      includedImpacts: ['critical', 'serious'],
    })
  })
  it('User can log out', () => {
    cy.login()
    const landingPage = IndexPage.verifyOnPage()
    landingPage.logout().click()
    AuthLoginPage.verifyOnPage()
  })
})

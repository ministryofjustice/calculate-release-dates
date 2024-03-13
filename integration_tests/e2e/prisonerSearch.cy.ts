import PrisonerSearchPage from '../pages/prisonerSearch'

context('Prisoner search', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubPrisonerSearch')
    cy.task('stubGetUserCaseloads')
    cy.task('stubComponents')
  })

  it('Visit prisoner search page', () => {
    cy.signIn()
    const prisonerSearchPage = PrisonerSearchPage.goTo()
    prisonerSearchPage.searchForFirstName('Marvin')
    prisonerSearchPage.prisonerLinkFor('A1234AB').should('exist')
  })

  it('Prisoner search page is accessible', () => {
    cy.signIn()
    const prisonerSearchPage = PrisonerSearchPage.goTo()
    prisonerSearchPage.searchForFirstName('Marvin')
    cy.injectAxe()
    cy.checkA11y()
  })
})

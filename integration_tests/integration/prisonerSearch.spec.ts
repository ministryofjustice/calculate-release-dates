import PrisonerSearchPage from '../pages/prisonerSearch'

context('Prisoner search', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubPrisonerSearch')
  })

  it('Visit prisoner search page', () => {
    cy.signIn()
    const prisonerSearchPage = PrisonerSearchPage.goTo()
    prisonerSearchPage.searchForFirstName('Marvin')
    prisonerSearchPage.checkNomisInformationButtonForPrisoner('A1234AB').should('exist')
  })

  it('Prisoner search page is accessible', () => {
    cy.signIn()
    const prisonerSearchPage = PrisonerSearchPage.goTo()
    prisonerSearchPage.searchForFirstName('Marvin')
    cy.injectAxe()
    cy.checkA11y(null, {
      includedImpacts: ['critical', 'serious'],
    })
  })
})

import CalculationCompletePage from '../pages/calculationComplete'

context('Calculation complete', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubGetPrisonerDetails')
  })

  it('Visit Calculation summary page', () => {
    cy.signIn()
    CalculationCompletePage.goTo('A1234AB', '123')
  })

  it('Calculation summary page is accessible', () => {
    cy.signIn()
    CalculationCompletePage.goTo('A1234AB', '123')
    cy.injectAxe()
    cy.checkA11y(null, {
      includedImpacts: ['critical', 'serious'],
    })
  })
})

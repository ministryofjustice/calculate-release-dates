import CalculationCompletePage from '../pages/calculationComplete'

context('Calculation complete', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPrisonerDetails')
    cy.task('stubGetUserCaseloads')
    cy.task('stubGetCalculationResults')
    cy.task('stubComponents')
    cy.task('stubHasNoIndeterminateSentences')
  })

  it('Visit Calculation complete page', () => {
    cy.signIn()
    CalculationCompletePage.goTo('A1234AB', '123')
  })

  it('Calculation complete page is accessible', () => {
    cy.signIn()
    CalculationCompletePage.goTo('A1234AB', '123')
    cy.injectAxe()
    cy.checkA11y()
  })
})

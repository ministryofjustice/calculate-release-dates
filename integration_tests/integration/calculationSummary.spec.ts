import CalculationSummaryPage from '../pages/calculationSummary'

context('Calculation summary', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubGetPrisonerDetails')
    cy.task('stubGetCalculationResults')
    cy.task('stubGetNextWorkingDay')
    cy.task('stubGetPreviousWorkingDay')
    cy.task('stubGetUserCaseloads')
  })

  it('Visit Calculation summary page', () => {
    cy.signIn()
    const calculationSummaryPage = CalculationSummaryPage.goTo('A1234AB', '123')
    calculationSummaryPage.submitToNomisButton().should('exist')
    calculationSummaryPage.sledDate().should('contain.text', 'Monday, 05 November 2018')
    calculationSummaryPage.crdDate().should('contain.text', 'Friday, 05 May 2017')
    calculationSummaryPage.crdWeekendAdjustment().should('contain.text', 'Sunday, 07 May 2017 adjusted for weekend')
    calculationSummaryPage.hdcedDate().should('contain.text', 'Wednesday, 28 December 2016')
    calculationSummaryPage
      .hdcedWeekendAdjustment()
      .should('contain.text', 'Saturday, 24 December 2016 adjusted for Bank Holiday')
  })

  it('Calculation summary page is accessible', () => {
    cy.signIn()
    CalculationSummaryPage.goTo('A1234AB', '123')
    cy.injectAxe()
    cy.checkA11y(null, {
      includedImpacts: ['critical', 'serious'],
    })
  })
})

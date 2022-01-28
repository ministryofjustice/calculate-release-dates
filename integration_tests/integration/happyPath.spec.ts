import IndexPage from '../pages'
import CalculationCompletePage from '../pages/calculationComplete'
import CalculationSummaryPage from '../pages/calculationSummary'
import CheckInformationPage from '../pages/checkInformation'
import Page from '../pages/page'
import PrisonerSearchPage from '../pages/prisonerSearch'

context('End to end happy path of user journey', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubPrisonerSearch')
    cy.task('stubGetUserCaseloads')
    cy.task('stubGetPrisonerDetails')
    cy.task('stubGetSentencesAndOffences')
    cy.task('stubGetSentenceAdjustments')
    cy.task('stubCalculatePreliminaryReleaseDates')
    cy.task('stubGetCalculationResults')
    cy.task('stubGetCalculationBreakdown')
    cy.task('stubConfirmCalculation')
    cy.task('stubGetNextWorkingDay')
    cy.task('stubGetPreviousWorkingDay')
    cy.task('stubValidate')
  })

  it('Standalone user journey', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.startNowButton().click()

    const prisonerSearchPage = Page.verifyOnPage(PrisonerSearchPage)
    prisonerSearchPage.searchForFirstName('Marvin')
    prisonerSearchPage.checkNomisInformationButtonForPrisoner('A1234AB').click()

    const checkInformationPage = Page.verifyOnPage(CheckInformationPage)
    checkInformationPage.calculateButton().click()

    const calculationSummaryPage = Page.verifyOnPage(CalculationSummaryPage)
    calculationSummaryPage.submitToNomisButton().click()

    const calculationCompletePage = Page.verifyOnPage(CalculationCompletePage)

    calculationCompletePage
      .title()
      .should('contain.text', 'Calculation complete for')
      .should('contain.text', 'Marvin Haggler')
  })

  it('DPS user journey', () => {
    cy.signIn()
    const indexPage = IndexPage.goTo('A1234AB')
    indexPage.startNowButton().click()

    const checkInformationPage = Page.verifyOnPage(CheckInformationPage)
    checkInformationPage.calculateButton().click()

    const calculationSummaryPage = Page.verifyOnPage(CalculationSummaryPage)
    calculationSummaryPage.submitToNomisButton().click()

    const calculationCompletePage = Page.verifyOnPage(CalculationCompletePage)

    calculationCompletePage
      .title()
      .should('contain.text', 'Calculation complete for')
      .should('contain.text', 'Marvin Haggler')
  })
})

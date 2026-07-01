import CalculationCompletePage from '../pages/calculationComplete'
import Page from '../pages/page'
import CCARDLandingPage from '../pages/CCARDLandingPage'
import CheckInformationPage from '../pages/checkInformation'
import CalculationSummaryPage from '../pages/calculationSummary'
import CalculationReasonPage from '../pages/reasonForCalculation'

context('End to end user journeys recording a second check', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubPrisonerSearch')
    cy.task('stubGetUserCaseloads')
    cy.task('stubGetPrisonerDetails')
    cy.task('stubGetSentencesAndOffences')
    cy.task('stubGetAnalyzedSentencesAndOffences')
    cy.task('stubCalculatePreliminaryReleaseDates')
    cy.task('stubGetCalculationResults')
    cy.task('stubConfirmCalculation')
    cy.task('stubGetNextWorkingDay')
    cy.task('stubGetPreviousWorkingDay')
    cy.task('stubValidate')
    cy.task('stubAdjustments')
    cy.task('stubGetAnalyzedSentenceAdjustments')
    cy.task('stubGetAdjustmentsForPrisoner')
    cy.task('stubSentencesAndOffences')
    cy.task('stubPrisonerDetails')
    cy.task('stubLatestCalculation')
    cy.task('stubCalculationUserInputs')
    cy.task('stubGetActiveCalculationReasons')
    cy.task('stubGetCalculationHistory')
    cy.task('stubGetDetailedCalculationResults')
    cy.task('stubComponents')
    cy.task('stubGetLatestCalculation')
    cy.task('stubGetReferenceDates')
    cy.task('stubHasNoIndeterminateSentences')
    cy.task('stubGetServiceDefinitions')
    cy.task('stubGetEligibility')
    cy.task('stubConfirmSecondCheck')
  })

  it('Can record a second check via link in landing page', () => {
    cy.signIn({ failOnStatusCode: false, returnUrl: '/prisonId=A1234AB' })
    const landingPage = CCARDLandingPage.goTo('A1234AB')
    landingPage.recordSecondCheckAction().click()

    const checkInformationPage = Page.verifyOnPage(CheckInformationPage)
    checkInformationPage.calculateButton().click()

    const calculationSummaryPage = Page.verifyOnPage(CalculationSummaryPage)
    calculationSummaryPage.submitToNomisButton().click()

    const calculationCompletePage = Page.verifyOnPage(CalculationCompletePage)

    calculationCompletePage.title().should('contain.text', 'Check recorded')
    calculationCompletePage.subText().should('contain.text', 'The check has been saved to the calculation history.')
  })

  it('Can record a second check via the calc reason page', () => {
    cy.signIn({ failOnStatusCode: false, returnUrl: '/prisonId=A1234AB' })

    const landingPage = CCARDLandingPage.goTo('A1234AB')
    landingPage.calculateReleaseDatesAction().click()

    const calculationReasonPage = CalculationReasonPage.verifyOnPage(CalculationReasonPage)
    calculationReasonPage.radioByReasonId(18).check()
    calculationReasonPage.submitReason().click()

    const checkInformationPage = Page.verifyOnPage(CheckInformationPage)
    checkInformationPage.calculateButton().click()

    const calculationSummaryPage = Page.verifyOnPage(CalculationSummaryPage)
    calculationSummaryPage.submitToNomisButton().click()

    const calculationCompletePage = Page.verifyOnPage(CalculationCompletePage)

    calculationCompletePage.title().should('contain.text', 'Check recorded')
    calculationCompletePage.subText().should('contain.text', 'The check has been saved to the calculation history.')
  })
})

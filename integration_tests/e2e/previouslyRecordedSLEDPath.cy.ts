import CalculationSummaryPage from '../pages/calculationSummary'
import CheckInformationPage from '../pages/checkInformation'
import Page from '../pages/page'
import CalculationReasonPage from '../pages/reasonForCalculation'
import CCARDLandingPage from '../pages/CCARDLandingPage'
import AuthorisedRoles from '../../server/enumerations/authorisedRoles'
import PreviouslyRecordedSledInterceptPage from '../pages/previouslyRecordedSledInterceptPage'
import { PreviouslyRecordedSLED } from '../../server/@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

context('End to end user journey with previously recorded SLED found', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', [
      AuthorisedRoles.ROLE_RELEASE_DATES_CALCULATOR,
      AuthorisedRoles.ROLE_CRD__GENUINE_OVERRIDES__RW,
    ])
    cy.task('stubManageUser')
    cy.task('stubPrisonerSearch')
    cy.task('stubGetUserCaseloads')
    cy.task('stubGetPrisonerDetails')
    cy.task('stubGetSentencesAndOffences')
    cy.task('stubGetAnalyzedSentencesAndOffences')
    cy.task('stubGetCalculationResults')
    cy.task('stubGetCalculationBreakdown')
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
    cy.task('stubSupportedValidationNoMessages')
    cy.task('stubGetActiveCalculationReasons')
    cy.task('stubGetCalculationHistory')
    cy.task('stubComponents')
    cy.task('stubGetLatestCalculation')
    cy.task('stubGetReferenceDates')
    cy.task('stubHasNoIndeterminateSentences')
    cy.task('stubGetServiceDefinitions')
    cy.task('stubGetEligibility')
    cy.task('stubGetGenuineOverrideReasons')
    cy.task('stubCreateGenuineOverrideSuccessfully', { originalCalcId: 123, newCalcId: 456 })
    cy.task('stubGetGenuineOverrideInputStandardMode')
    cy.task('stubManualEntryDateValidation')

    cy.signIn()
    const landingPage = CCARDLandingPage.goTo('A1234AB')
    landingPage.calculateReleaseDatesAction().click()

    const calculationReasonPage = CalculationReasonPage.verifyOnPage(CalculationReasonPage)
    calculationReasonPage.radioByIndex(1).check()
    calculationReasonPage.submitReason().click()
  })

  it('Intercept if previously recorded SLED found', () => {
    const previouslyRecordedSLED: PreviouslyRecordedSLED = {
      previouslyRecordedSLEDDate: '2025-01-03',
      calculatedDate: '2018-11-05',
      previouslyRecordedSLEDCalculationRequestId: 789456123,
    }
    cy.task('stubCalculatePreliminaryReleaseDates', {
      calculationRequestId: 123,
      usedPreviouslyRecordedSLED: previouslyRecordedSLED,
    })
    cy.task('stubGetDetailedCalculationResults', { previouslyRecordedSLED })

    const checkInformationPage = Page.verifyOnPage(CheckInformationPage)
    checkInformationPage.calculateButton().click()

    Page.verifyOnPage(PreviouslyRecordedSledInterceptPage) //
      .selectRadio('YES')
      .clickContinue()

    const calculationSummaryPageAfterSelectingYes = CalculationSummaryPage.goTo('A1234AB', '123')
    calculationSummaryPageAfterSelectingYes.sledDate().should('contain.text', 'Friday, 03 January 2025')
    calculationSummaryPageAfterSelectingYes.clickBack()

    const interceptPageAfterBack = Page.verifyOnPage(PreviouslyRecordedSledInterceptPage)
    // next prelim calc would have no previously recorded SLED
    cy.task('stubCalculatePreliminaryReleaseDates', {
      calculationRequestId: 456,
    })
    cy.task('stubGetDetailedCalculationResults')
    interceptPageAfterBack.selectRadio('NO').clickContinue()

    const calculationSummaryPageAfterSelectingNo = CalculationSummaryPage.goTo('A1234AB', '456')
    calculationSummaryPageAfterSelectingNo.sledDate().should('contain.text', 'Monday, 05 November 2018')

    cy.task('stubGetDetailedCalculationResults', { previouslyRecordedSLED })
    calculationSummaryPageAfterSelectingNo.clickBack()

    Page.verifyOnPage(PreviouslyRecordedSledInterceptPage).clickBack()

    Page.verifyOnPage(CheckInformationPage)
  })
})

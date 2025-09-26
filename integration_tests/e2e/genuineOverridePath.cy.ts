import CalculationCompletePage from '../pages/calculationComplete'
import CalculationSummaryPage from '../pages/calculationSummary'
import CheckInformationPage from '../pages/checkInformation'
import Page from '../pages/page'
import ApprovedDatesQuestionPage from '../pages/approvedDatesQuestion'
import CalculationReasonPage from '../pages/reasonForCalculation'
import CCARDLandingPage from '../pages/CCARDLandingPage'
import ApprovedDatesSelectDatesToEnterPage from '../pages/approvedDatesSelectDatesToEnter'
import ApprovedDatesEnterDatePage from '../pages/approvedDatesEnterDate'
import AuthorisedRoles from '../../server/enumerations/authorisedRoles'
import GenuineOverrideReasonPage from '../pages/genuineOverrideReasonPage'
import GenuineOverrideReviewDatesPage from '../pages/genuineOverrideReviewDatesPage'
import GenuineOverridesSelectDatesToEnterPage from '../pages/genuineOverridesSelectDatesToEnterPage'
import GenuineOverrideEnterDatePage from '../pages/genuineOverrideEnterDatePage'

context('End to end user journeys for a user with genuine overrides access', () => {
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
    cy.task('stubCalculatePreliminaryReleaseDates')
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
    cy.task('stubGetDetailedCalculationResults')
    cy.task('stubComponents')
    cy.task('stubGetLatestCalculation')
    cy.task('stubGetReferenceDates')
    cy.task('stubHasNoIndeterminateSentences')
    cy.task('stubGetServiceDefinitions')
    cy.task('stubGetEligibility')
    cy.task('stubGetGenuineOverrideReasons')
  })

  it('Ask for approved dates if happy with calculated dates', () => {
    cy.signIn()
    const landingPage = CCARDLandingPage.goTo('A1234AB')
    landingPage.calculateReleaseDatesAction().click()

    const calculationReasonPage = CalculationReasonPage.verifyOnPage(CalculationReasonPage)
    calculationReasonPage.radioByIndex(1).check()
    calculationReasonPage.submitReason().click()

    const checkInformationPage = Page.verifyOnPage(CheckInformationPage)
    checkInformationPage.calculateButton().click()

    const calculationSummaryPage = Page.verifyOnPage(CalculationSummaryPage)
    calculationSummaryPage.agreeWithDatesRadio('YES').check()
    calculationSummaryPage.continueButton().click()

    const approvedDatesQuestionPage = Page.verifyOnPage(ApprovedDatesQuestionPage)
    approvedDatesQuestionPage.yes().click()
    approvedDatesQuestionPage.continue().click()

    const selectApprovedDatesTypesPage = Page.verifyOnPage(ApprovedDatesSelectDatesToEnterPage)
    selectApprovedDatesTypesPage.expectDateOffered(['APD', 'HDCAD', 'ROTL'])
    selectApprovedDatesTypesPage.checkDate('APD')
    selectApprovedDatesTypesPage.continue().click()

    const enterApdPage = Page.verifyOnPage(ApprovedDatesEnterDatePage)
    enterApdPage.checkIsFor('APD')
    enterApdPage.enterDate('APD', '01', '06', '2026')
    enterApdPage.continue().click()

    const calculationSummaryPageAfterApprovedDates = Page.verifyOnPage(CalculationSummaryPage)
    calculationSummaryPageAfterApprovedDates.dateShouldHaveValue('APD', 'Monday, 01 June 2026')
    calculationSummaryPageAfterApprovedDates.submitToNomisButton().click()

    const calculationCompletePage = Page.verifyOnPage(CalculationCompletePage)

    calculationCompletePage.title().should('contain.text', 'Calculation complete')
  })

  it('Can add dates if not agreeing with the calculated dates', () => {
    cy.signIn()
    const landingPage = CCARDLandingPage.goTo('A1234AB')
    landingPage.calculateReleaseDatesAction().click()

    const calculationReasonPage = CalculationReasonPage.verifyOnPage(CalculationReasonPage)
    calculationReasonPage.radioByIndex(1).check()
    calculationReasonPage.submitReason().click()

    const checkInformationPage = Page.verifyOnPage(CheckInformationPage)
    checkInformationPage.calculateButton().click()

    const calculationSummaryPage = Page.verifyOnPage(CalculationSummaryPage)
    calculationSummaryPage.agreeWithDatesRadio('NO').check()
    calculationSummaryPage.continueButton().click()

    const genuineOverrideReasonPage = Page.verifyOnPage(GenuineOverrideReasonPage)
    genuineOverrideReasonPage.radioByCode('TERRORISM').check()
    genuineOverrideReasonPage.continueButton().click()

    const initialReviewPage = Page.verifyOnPage(GenuineOverrideReviewDatesPage)
    initialReviewPage.expectDates(['LED', 'SED', 'CRD', 'HDCED'])
    initialReviewPage.addDatesLink().click()

    const selectDatesPage = Page.verifyOnPage(GenuineOverridesSelectDatesToEnterPage)
    selectDatesPage.expectDateOffered([
      'SED',
      'LED',
      'CRD',
      'HDCED',
      'TUSED',
      'PRRD',
      'PED',
      'ROTL',
      'ERSED',
      'ARD',
      'HDCAD',
      'MTD',
      'ETD',
      'LTD',
      'APD',
      'NPD',
      'DPRRD',
    ])
    selectDatesPage.expectDateToBeUnavailable('SED')
    selectDatesPage.expectDateToBeUnavailable('LED')
    selectDatesPage.expectDateToBeUnavailable('CRD')
    selectDatesPage.expectDateToBeUnavailable('HDCED')
    selectDatesPage.checkDate('TUSED')
    selectDatesPage.checkDate('ERSED')
    selectDatesPage.continue('continue-button').click()

    const enterTusedPage = Page.verifyOnPage(GenuineOverrideEnterDatePage)
    enterTusedPage.checkIsFor('TUSED (Top up supervision expiry date)')
    enterTusedPage.enterDate('01', '02', '2025')
    enterTusedPage.continue().click()

    const enterErsedPage = Page.verifyOnPage(GenuineOverrideEnterDatePage)
    enterErsedPage.checkIsFor('ERSED (Early removal scheme eligibility date)')
    enterErsedPage.backButton().click()

    enterTusedPage.checkIsFor('TUSED (Top up supervision expiry date)')
    enterTusedPage.backButton().click()

    const selectDatesPageRevisited = Page.verifyOnPage(GenuineOverridesSelectDatesToEnterPage)
    selectDatesPageRevisited.uncheckDate('ERSED')
    selectDatesPageRevisited.uncheckDate('TUSED')
    selectDatesPageRevisited.checkDate('HDCAD')
    selectDatesPageRevisited.continue('continue-button').click()

    const enterHdcadPage = Page.verifyOnPage(GenuineOverrideEnterDatePage)
    enterHdcadPage.checkIsFor('HDCAD (Home detention curfew approved date)')
    enterHdcadPage.enterDate('01', '02', '2025')
    enterHdcadPage.continue().click()

    const afterAddReviewPage = Page.verifyOnPage(GenuineOverrideReviewDatesPage)
    afterAddReviewPage.expectDates(['LED', 'SED', 'CRD', 'HDCED', 'HDCAD'])
    // TODO wip journey
  })
})

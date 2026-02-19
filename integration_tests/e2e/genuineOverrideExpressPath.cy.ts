import CalculationSummaryPage from '../pages/calculationSummary'
import CheckInformationPage from '../pages/checkInformation'
import Page from '../pages/page'
import CalculationReasonPage from '../pages/reasonForCalculation'
import CCARDLandingPage from '../pages/CCARDLandingPage'
import AuthorisedRoles from '../../server/enumerations/authorisedRoles'
import GenuineOverrideExpressInterceptPage from '../pages/genuineOverrideExpressInterceptPage'
import GenuineOverrideReviewPreviousOverridePage from '../pages/genuineOverrideReviewPreviousOverridePage'
import CalculationCompletePage from '../pages/calculationComplete'
import GenuineOverrideReasonPage from '../pages/genuineOverrideReasonPage'
import GenuineOverrideReviewDatesPage from '../pages/genuineOverrideReviewDatesPage'
import GenuineOverrideEnterDatePage from '../pages/genuineOverrideEnterDatePage'
import GenuineOverrideRemoveDatePage from '../pages/genuineOverrideRemoveDatePage'
import GenuineOverridesSelectDatesToEnterPage from '../pages/genuineOverridesSelectDatesToEnterPage'
import CancelQuestionPage from '../pages/cancelQuestion'

context(
  'End to end user journeys when the previous calculation was a genuine override with no changes to the booking since',
  () => {
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
      cy.task('stubCreateGenuineOverrideSuccessfully', { originalCalcId: 123, newCalcId: 456 })
      cy.task('stubManualEntryDateValidation')

      cy.signIn({ failOnStatusCode: false, returnUrl: '/?prisonId=A1234AB' })
      const landingPage = CCARDLandingPage.goTo('A1234AB')
      landingPage.calculateReleaseDatesAction().click()

      const calculationReasonPage = CalculationReasonPage.verifyOnPage(CalculationReasonPage)
      calculationReasonPage.radioByReasonId(1).check()
      calculationReasonPage.submitReason().click()

      const checkInformationPage = Page.verifyOnPage(CheckInformationPage)
      checkInformationPage.calculateButton().click()
    })

    it('Can agree with the previous genuine override and submit without further detail in the previous override', () => {
      cy.task('stubGetGenuineOverrideInputExpressMode', {
        calculationRequestId: 123456789897,
        dates: [
          { dateType: 'SLED', date: '2025-06-07' },
          { dateType: 'CRD', date: '2024-05-06' },
        ],
        reason: 'TERRORISM',
      })

      const calculationSummaryPage = Page.verifyOnPage(CalculationSummaryPage)
      calculationSummaryPage.agreeWithDatesRadio('NO').check()
      calculationSummaryPage.continueButton().click()

      Page.verifyOnPage(GenuineOverrideExpressInterceptPage) //
        .hasReason('Terrorism')
        .clickContinue()

      Page.verifyOnPage(GenuineOverrideReviewPreviousOverridePage) //
        .selectRadio('YES')
        .clickContinue()

      Page.verifyOnPage(CalculationCompletePage) //
        .title()
        .should('contain.text', 'Calculation complete')

      cy.verifyLastAPICall(
        {
          method: 'POST',
          urlPath: `/calculate-release-dates/genuine-override/calculation/123`,
        },
        {
          dates: [
            { dateType: 'LED', date: '2025-06-07' },
            { dateType: 'SED', date: '2025-06-07' },
            { dateType: 'CRD', date: '2024-05-06' },
          ],
          reason: 'TERRORISM',
        },
      )
    })

    it('Can agree with the previous genuine override and submit with further detail in the previous override', () => {
      cy.task('stubGetGenuineOverrideInputExpressMode', {
        calculationRequestId: 123456789897,
        dates: [
          { dateType: 'SLED', date: '2025-06-07' },
          { dateType: 'CRD', date: '2024-05-06' },
        ],
        reason: 'OTHER',
        reasonFurtherDetail: 'Something more to say',
      })

      const calculationSummaryPage = Page.verifyOnPage(CalculationSummaryPage)
      calculationSummaryPage.agreeWithDatesRadio('NO').check()
      calculationSummaryPage.continueButton().click()

      Page.verifyOnPage(GenuineOverrideExpressInterceptPage) //
        .hasReason('Something more to say')
        .clickContinue()

      Page.verifyOnPage(GenuineOverrideReviewPreviousOverridePage) //
        .selectRadio('YES')
        .clickContinue()

      Page.verifyOnPage(CalculationCompletePage) //
        .title()
        .should('contain.text', 'Calculation complete')

      cy.verifyLastAPICall(
        {
          method: 'POST',
          urlPath: `/calculate-release-dates/genuine-override/calculation/123`,
        },
        {
          dates: [
            { dateType: 'LED', date: '2025-06-07' },
            { dateType: 'SED', date: '2025-06-07' },
            { dateType: 'CRD', date: '2024-05-06' },
          ],
          reason: 'OTHER',
          reasonFurtherDetail: 'Something more to say',
        },
      )
    })

    it('Can disagree with the previous genuine override and create a new one', () => {
      cy.task('stubGetGenuineOverrideInputExpressMode', {
        calculationRequestId: 123456789897,
        dates: [
          { dateType: 'SLED', date: '2025-06-07' },
          { dateType: 'CRD', date: '2024-05-06' },
          { dateType: 'HDCED', date: '2024-03-02' },
        ],
        reason: 'OTHER',
        reasonFurtherDetail: 'Something more to say',
      })

      const calculationSummaryPage = Page.verifyOnPage(CalculationSummaryPage)
      calculationSummaryPage.agreeWithDatesRadio('NO').check()
      calculationSummaryPage.continueButton().click()

      Page.verifyOnPage(GenuineOverrideExpressInterceptPage) //
        .hasReason('Something more to say')
        .clickContinue()

      Page.verifyOnPage(GenuineOverrideReviewPreviousOverridePage) //
        .selectRadio('NO')
        .clickContinue()

      Page.verifyOnPage(GenuineOverrideReasonPage) //
        .selectRadio('TERRORISM')
        .clickContinue()

      Page.verifyOnPage(GenuineOverrideReviewDatesPage) //
        .expectDates(['LED', 'SED', 'CRD', 'HDCED'])
        .expectDate('CRD', '06 May 2024')
        .expectDate('HDCED', '02 March 2024')
        .expectDate('LED', '07 June 2025')
        .expectDate('SED', '07 June 2025')
        .deleteDateLink('HDCED')
        .click()

      Page.verifyOnPage(GenuineOverrideRemoveDatePage) //
        .checkIsFor('HDCED (Home detention curfew eligibility date)')
        .selectRadio('YES')
        .continue()
        .click()

      Page.verifyOnPage(GenuineOverrideReviewDatesPage) //
        .expectDates(['LED', 'SED', 'CRD'])
        .expectDate('CRD', '06 May 2024')
        .expectDate('LED', '07 June 2025')
        .expectDate('SED', '07 June 2025')
        .editDateLink('CRD')
        .click()

      Page.verifyOnPage(GenuineOverrideEnterDatePage) //
        .checkIsFor('CRD (Conditional release date)')
        .hasDate('6', '5', '2024')
        .clearDate()
        .enterDate('01', '02', '2024')
        .clickContinue()

      Page.verifyOnPage(GenuineOverrideReviewDatesPage) //
        .expectDates(['LED', 'SED', 'CRD'])
        .expectDate('CRD', '01 February 2024')
        .expectDate('LED', '07 June 2025')
        .expectDate('SED', '07 June 2025')
        .addDatesLink()
        .click()

      Page.verifyOnPage(GenuineOverridesSelectDatesToEnterPage) //
        .checkDate('TUSED')
        .continue('continue-button')
        .click()

      Page.verifyOnPage(GenuineOverrideEnterDatePage) //
        .checkIsFor('TUSED (Top up supervision expiry date)')
        .enterDate('19', '12', '2024')
        .clickContinue()

      Page.verifyOnPage(GenuineOverrideReviewDatesPage) //
        .expectDates(['LED', 'SED', 'CRD', 'TUSED'])
        .expectDate('CRD', '01 February 2024')
        .expectDate('LED', '07 June 2025')
        .expectDate('SED', '07 June 2025')
        .expectDate('TUSED', '19 December 2024')
        .continueButton()
        .click()

      Page.verifyOnPage(CalculationCompletePage) //
        .title()
        .should('contain.text', 'Calculation complete')

      cy.verifyLastAPICall(
        {
          method: 'POST',
          urlPath: `/calculate-release-dates/genuine-override/calculation/123`,
        },
        {
          dates: [
            { dateType: 'LED', date: '2025-06-07' },
            { dateType: 'SED', date: '2025-06-07' },
            { dateType: 'CRD', date: '2024-02-01' },
            { dateType: 'TUSED', date: '2024-12-19' },
          ],
          reason: 'TERRORISM',
        },
      )
    })

    it('Back buttons work as expected', () => {
      cy.task('stubGetGenuineOverrideInputExpressMode', {
        calculationRequestId: 123456789897,
        dates: [
          { dateType: 'SLED', date: '2025-06-07' },
          { dateType: 'CRD', date: '2024-05-06' },
          { dateType: 'HDCED', date: '2024-03-02' },
        ],
        reason: 'OTHER',
        reasonFurtherDetail: 'Something more to say',
      })

      const calculationSummaryPage = Page.verifyOnPage(CalculationSummaryPage)
      calculationSummaryPage.agreeWithDatesRadio('NO').check()
      calculationSummaryPage.continueButton().click()

      Page.verifyOnPage(GenuineOverrideExpressInterceptPage) //
        .hasReason('Something more to say')
        .clickContinue()

      Page.verifyOnPage(GenuineOverrideReviewPreviousOverridePage) //
        .selectRadio('NO')
        .clickContinue()

      Page.verifyOnPage(GenuineOverrideReasonPage) //
        .selectRadio('TERRORISM')
        .clickContinue()

      Page.verifyOnPage(GenuineOverrideReviewDatesPage) //
        .clickBack()

      Page.verifyOnPage(GenuineOverrideReasonPage) //
        .clickBack()

      Page.verifyOnPage(GenuineOverrideReviewPreviousOverridePage) //
        .clickBack()

      Page.verifyOnPage(GenuineOverrideExpressInterceptPage) //
        .clickBack()

      Page.verifyOnPage(CalculationSummaryPage)
    })

    it('Cancel buttons work as expected', () => {
      cy.task('stubGetGenuineOverrideInputExpressMode', {
        calculationRequestId: 123456789897,
        dates: [
          { dateType: 'SLED', date: '2025-06-07' },
          { dateType: 'CRD', date: '2024-05-06' },
          { dateType: 'HDCED', date: '2024-03-02' },
        ],
        reason: 'OTHER',
        reasonFurtherDetail: 'Something more to say',
      })

      const calculationSummaryPage = Page.verifyOnPage(CalculationSummaryPage)
      calculationSummaryPage.agreeWithDatesRadio('NO').check()
      calculationSummaryPage.continueButton().click()

      Page.verifyOnPage(GenuineOverrideExpressInterceptPage) //
        .clickCancel()

      Page.verifyOnPage(CancelQuestionPage).clickNo().clickConfirm()

      Page.verifyOnPage(GenuineOverrideExpressInterceptPage) //
        .clickContinue()

      Page.verifyOnPage(GenuineOverrideReviewPreviousOverridePage) //
        .clickCancel()

      Page.verifyOnPage(CancelQuestionPage).clickNo().clickConfirm()

      Page.verifyOnPage(GenuineOverrideReviewPreviousOverridePage) //
        .selectRadio('NO')
        .clickContinue()

      Page.verifyOnPage(GenuineOverrideReasonPage) //
        .clickCancel()

      Page.verifyOnPage(CancelQuestionPage).clickNo().clickConfirm()

      Page.verifyOnPage(GenuineOverrideReasonPage) //
        .selectRadio('TERRORISM')
        .clickContinue()

      Page.verifyOnPage(GenuineOverrideReviewDatesPage) //
        .cancel()
        .click()

      Page.verifyOnPage(CancelQuestionPage).clickNo().clickConfirm()

      Page.verifyOnPage(GenuineOverrideReviewDatesPage) //
        .deleteDateLink('HDCED')
        .click()

      Page.verifyOnPage(GenuineOverrideRemoveDatePage) //
        .checkIsFor('HDCED (Home detention curfew eligibility date)')
        .clickCancel()

      Page.verifyOnPage(CancelQuestionPage).clickNo().clickConfirm()

      Page.verifyOnPage(GenuineOverrideRemoveDatePage) //
        .checkIsFor('HDCED (Home detention curfew eligibility date)')
        .selectRadio('NO')
        .continue()
        .click()

      Page.verifyOnPage(GenuineOverrideReviewDatesPage) //
        .editDateLink('HDCED')
        .click()

      Page.verifyOnPage(GenuineOverrideEnterDatePage) //
        .checkIsFor('HDCED (Home detention curfew eligibility date)')
        .clickCancel()

      Page.verifyOnPage(CancelQuestionPage).clickNo().clickConfirm()

      Page.verifyOnPage(GenuineOverrideEnterDatePage) //
        .checkIsFor('HDCED (Home detention curfew eligibility date)')
        .clickBack()

      Page.verifyOnPage(GenuineOverrideReviewDatesPage) //
        .addDatesLink()
        .click()

      Page.verifyOnPage(GenuineOverridesSelectDatesToEnterPage) //
        .clickCancel()

      Page.verifyOnPage(CancelQuestionPage).clickNo().clickConfirm()

      Page.verifyOnPage(GenuineOverridesSelectDatesToEnterPage) //
        .checkDate('TUSED')
        .continue('continue-button')
        .click()

      Page.verifyOnPage(GenuineOverrideEnterDatePage) //
        .checkIsFor('TUSED (Top up supervision expiry date)')
        .clickCancel()

      Page.verifyOnPage(CancelQuestionPage).clickNo().clickConfirm()

      Page.verifyOnPage(GenuineOverrideEnterDatePage) //
        .checkIsFor('TUSED (Top up supervision expiry date)')
        .clickBack()

      Page.verifyOnPage(GenuineOverridesSelectDatesToEnterPage) //
        .clickBack()

      Page.verifyOnPage(GenuineOverrideReviewDatesPage)
    })
  },
)

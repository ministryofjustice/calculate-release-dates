import dayjs from 'dayjs'
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
import GenuineOverrideRemoveDatePage from '../pages/genuineOverrideRemoveDatePage'

context('End to end user journeys for a user with genuine overrides access', () => {
  // stubGetCalculationResults returns an HDCED 3 days in the future and a CRD 7 days in the future
  const defaultCrd = dayjs().add(7, 'day')
  const defaultHdced = dayjs().add(3, 'day')

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
    cy.task('stubGetGenuineOverrideInputStandardMode')
    cy.task('stubManualEntryDateValidation')

    cy.signIn()
    const landingPage = CCARDLandingPage.goTo('A1234AB')
    landingPage.calculateReleaseDatesAction().click()

    const calculationReasonPage = CalculationReasonPage.verifyOnPage(CalculationReasonPage)
    calculationReasonPage.radioByIndex(1).check()
    calculationReasonPage.submitReason().click()

    const checkInformationPage = Page.verifyOnPage(CheckInformationPage)
    checkInformationPage.calculateButton().click()
  })

  it('Ask for approved dates if happy with calculated dates', () => {
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
    const calculationSummaryPage = Page.verifyOnPage(CalculationSummaryPage)
    calculationSummaryPage.agreeWithDatesRadio('NO').check()
    calculationSummaryPage.continueButton().click()

    Page.verifyOnPage(GenuineOverrideReasonPage) //
      .selectRadio('TERRORISM')
      .clickContinue()

    Page.verifyOnPage(GenuineOverrideReviewDatesPage) //
      .expectDates(['LED', 'SED', 'CRD', 'HDCED'])
      .addDatesLink()
      .click()

    Page.verifyOnPage(GenuineOverridesSelectDatesToEnterPage) //
      .expectDateOffered([
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
      .expectDateToBeUnavailable('SED')
      .expectDateToBeUnavailable('LED')
      .expectDateToBeUnavailable('CRD')
      .expectDateToBeUnavailable('HDCED')
      .checkDate('TUSED')
      .checkDate('ERSED')
      .continue('continue-button')
      .click()

    Page.verifyOnPage(GenuineOverrideEnterDatePage) //
      .checkIsFor('TUSED (Top up supervision expiry date)')
      .enterDate('01', '02', '2025')
      .clickContinue()

    Page.verifyOnPage(GenuineOverrideEnterDatePage) //
      .checkIsFor('ERSED (Early removal scheme eligibility date)')
      .clickBack()

    Page.verifyOnPage(GenuineOverrideEnterDatePage) //
      .checkIsFor('TUSED (Top up supervision expiry date)')
      .clickBack()

    Page.verifyOnPage(GenuineOverridesSelectDatesToEnterPage) //
      .uncheckDate('ERSED')
      .uncheckDate('TUSED')
      .checkDate('HDCAD')
      .continue('continue-button')
      .click()

    Page.verifyOnPage(GenuineOverrideEnterDatePage) //
      .checkIsFor('HDCAD (Home detention curfew approved date)')
      .enterDate('01', '02', '2025')
      .clickContinue()

    Page.verifyOnPage(GenuineOverrideReviewDatesPage) //
      .expectDates(['LED', 'SED', 'CRD', 'HDCED', 'HDCAD'])
      .expectDate('CRD', defaultCrd.format('DD MMMM YYYY'))
      .expectDate('HDCED', defaultHdced.format('DD MMMM YYYY'))
      .expectDate('HDCAD', '01 February 2025')
      .expectDate('LED', '05 November 2018')
      .expectDate('SED', '05 November 2018')
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
          { dateType: 'LED', date: '2018-11-05' },
          { dateType: 'SED', date: '2018-11-05' },
          { dateType: 'CRD', date: defaultCrd.format('YYYY-MM-DD') },
          { dateType: 'HDCED', date: defaultHdced.format('YYYY-MM-DD') },
          { dateType: 'HDCAD', date: '2025-02-01' },
        ],
        reason: 'TERRORISM',
      },
    )
  })

  it('Can edit dates if not agreeing with the calculated dates', () => {
    const calculationSummaryPage = Page.verifyOnPage(CalculationSummaryPage)
    calculationSummaryPage.agreeWithDatesRadio('NO').check()
    calculationSummaryPage.continueButton().click()

    Page.verifyOnPage(GenuineOverrideReasonPage) //
      .selectRadio('OTHER')
      .enterReasonFurtherDetail('Some more details')
      .clickContinue()

    Page.verifyOnPage(GenuineOverrideReviewDatesPage) //
      .expectDates(['LED', 'SED', 'CRD', 'HDCED'])
      .expectDate('CRD', defaultCrd.format('DD MMMM YYYY'))
      .expectDate('HDCED', defaultHdced.format('DD MMMM YYYY'))
      .expectDate('LED', '05 November 2018')
      .expectDate('SED', '05 November 2018')
      .editDateLink('HDCED')
      .click()

    Page.verifyOnPage(GenuineOverrideEnterDatePage) //
      .checkIsFor('HDCED (Home detention curfew eligibility date)')
      .hasDate(defaultHdced.date().toString(), (defaultHdced.month() + 1).toString(), defaultHdced.year().toString())
      .clearDate()
      .enterDate('01', '02', '2025')
      .clickContinue()

    Page.verifyOnPage(GenuineOverrideReviewDatesPage) //
      .editDateLink('HDCED')
      .click()

    Page.verifyOnPage(GenuineOverrideEnterDatePage) //
      .checkIsFor('HDCED (Home detention curfew eligibility date)')
      .clickBack()

    Page.verifyOnPage(GenuineOverrideReviewDatesPage) //
      .expectDates(['LED', 'SED', 'CRD', 'HDCED'])
      .expectDate('CRD', defaultCrd.format('DD MMMM YYYY'))
      .expectDate('HDCED', '01 February 2025')
      .expectDate('LED', '05 November 2018')
      .expectDate('SED', '05 November 2018')
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
          { dateType: 'LED', date: '2018-11-05' },
          { dateType: 'SED', date: '2018-11-05' },
          { dateType: 'CRD', date: defaultCrd.format('YYYY-MM-DD') },
          { dateType: 'HDCED', date: '2025-02-01' },
        ],
        reason: 'OTHER',
        reasonFurtherDetail: 'Some more details',
      },
    )
  })

  it('Can delete dates if not agreeing with the calculated dates', () => {
    const calculationSummaryPage = Page.verifyOnPage(CalculationSummaryPage)
    calculationSummaryPage.agreeWithDatesRadio('NO').check()
    calculationSummaryPage.continueButton().click()

    Page.verifyOnPage(GenuineOverrideReasonPage) //
      .selectRadio('OTHER')
      .enterReasonFurtherDetail('Some more details')
      .clickContinue()

    Page.verifyOnPage(GenuineOverrideReviewDatesPage) //
      .expectDates(['LED', 'SED', 'CRD', 'HDCED'])
      .expectDate('CRD', defaultCrd.format('DD MMMM YYYY'))
      .expectDate('HDCED', defaultHdced.format('DD MMMM YYYY'))
      .expectDate('LED', '05 November 2018')
      .expectDate('SED', '05 November 2018')
      .deleteDateLink('HDCED')
      .click()

    Page.verifyOnPage(GenuineOverrideRemoveDatePage) //
      .checkIsFor('HDCED (Home detention curfew eligibility date)')
      .selectRadio('YES')
      .continue()
      .click()

    Page.verifyOnPage(GenuineOverrideReviewDatesPage) //
      .expectDates(['LED', 'SED', 'CRD'])
      .expectDate('CRD', defaultCrd.format('DD MMMM YYYY'))
      .expectDate('LED', '05 November 2018')
      .expectDate('SED', '05 November 2018')
      .deleteDateLink('CRD')
      .click()

    Page.verifyOnPage(GenuineOverrideRemoveDatePage) //
      .checkIsFor('CRD (Conditional release date)')
      .selectRadio('NO')
      .continue()
      .click()

    Page.verifyOnPage(GenuineOverrideReviewDatesPage) //
      .expectDates(['LED', 'SED', 'CRD'])
      .expectDate('CRD', defaultCrd.format('DD MMMM YYYY'))
      .expectDate('LED', '05 November 2018')
      .expectDate('SED', '05 November 2018')
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
          { dateType: 'LED', date: '2018-11-05' },
          { dateType: 'SED', date: '2018-11-05' },
          { dateType: 'CRD', date: defaultCrd.format('YYYY-MM-DD') },
        ],
        reason: 'OTHER',
        reasonFurtherDetail: 'Some more details',
      },
    )
  })

  it('Can handle validation errors from the server on submit', () => {
    cy.task('stubCreateGenuineOverrideFailsWithValidationError', {
      originalCalcId: 123,
      validationMessages: [
        { code: 'DATES_MISSING_REQUIRED_TYPE', message: 'Error 1', type: 'VALIDATION', arguments: [] },
        { code: 'DATES_PAIRINGS_INVALID', message: 'Error 2', type: 'VALIDATION', arguments: [] },
      ],
    })
    const calculationSummaryPage = Page.verifyOnPage(CalculationSummaryPage)
    calculationSummaryPage.agreeWithDatesRadio('NO').check()
    calculationSummaryPage.continueButton().click()

    Page.verifyOnPage(GenuineOverrideReasonPage) //
      .selectRadio('TERRORISM')
      .clickContinue()

    Page.verifyOnPage(GenuineOverrideReviewDatesPage) //
      .continueButton()
      .click()

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: `/calculate-release-dates/genuine-override/calculation/123`,
      },
      {
        dates: [
          { dateType: 'LED', date: '2018-11-05' },
          { dateType: 'SED', date: '2018-11-05' },
          { dateType: 'CRD', date: defaultCrd.format('YYYY-MM-DD') },
          { dateType: 'HDCED', date: defaultHdced.format('YYYY-MM-DD') },
        ],
        reason: 'TERRORISM',
      },
    )

    const reviewDatesPage = Page.verifyOnPage(GenuineOverrideReviewDatesPage)
    reviewDatesPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(2)
      expect($lis[0]).to.contain('Error 1')
      expect($lis[1]).to.contain('Error 2')
    })
  })

  it('Can handle validation errors from the server on selecting dates', () => {
    cy.task('stubManualEntryDateValidationWithErrors', [
      { code: 'DATES_MISSING_REQUIRED_TYPE', message: 'Error 1', type: 'VALIDATION', arguments: [] },
      { code: 'DATES_PAIRINGS_INVALID', message: 'Error 2', type: 'VALIDATION', arguments: [] },
    ])
    const calculationSummaryPage = Page.verifyOnPage(CalculationSummaryPage)
    calculationSummaryPage.agreeWithDatesRadio('NO').check()
    calculationSummaryPage.continueButton().click()

    Page.verifyOnPage(GenuineOverrideReasonPage) //
      .selectRadio('TERRORISM')
      .clickContinue()

    Page.verifyOnPage(GenuineOverrideReviewDatesPage) //
      .addDatesLink()
      .click()

    const reviewDatesPage = Page.verifyOnPage(GenuineOverridesSelectDatesToEnterPage)
    reviewDatesPage.checkDate('ERSED')
    reviewDatesPage.continue('continue-button').click()
    reviewDatesPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(2)
      expect($lis[0]).to.contain('Error 1')
      expect($lis[1]).to.contain('Error 2')
    })
  })

  it('Back buttons work as expected', () => {
    const calculationSummaryPage = Page.verifyOnPage(CalculationSummaryPage)
    calculationSummaryPage.agreeWithDatesRadio('NO').check()
    calculationSummaryPage.continueButton().click()

    Page.verifyOnPage(GenuineOverrideReasonPage) //
      .selectRadio('TERRORISM')
      .clickContinue()

    Page.verifyOnPage(GenuineOverrideReviewDatesPage) //
      .clickBack()

    Page.verifyOnPage(GenuineOverrideReasonPage) //
      .clickBack()

    Page.verifyOnPage(CalculationSummaryPage)
  })
})

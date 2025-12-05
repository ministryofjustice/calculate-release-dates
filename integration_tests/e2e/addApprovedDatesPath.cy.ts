import CalculationCompletePage from '../pages/calculationComplete'
import Page from '../pages/page'
import CCARDLandingPage from '../pages/CCARDLandingPage'
import StandaloneApprovedDatesReviewCalculatedDatesPage from '../pages/standaloneApprovedDatesReviewCalculatedDatesPage'
import StandaloneApprovedDatesSelectDatesToEnterPage from '../pages/standaloneApprovedDatesSelectDatesToEnterPage'
import StandaloneEnterApprovedDatePage from '../pages/standaloneEnterApprovedDatePage'
import StandaloneReviewApprovedDatesPage from '../pages/standaloneReviewApprovedDatesPage'
import StandaloneRemoveApprovedDatePage from '../pages/standaloneRemoveApprovedDatePage'

context('End to end user journeys entering and modifying approved dates through dedicated link', () => {
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
  })

  it('Can add all dates if approved dates is available', () => {
    cy.task('stubAvailableApprovedDatesInputs')

    cy.signIn()
    const landingPage = CCARDLandingPage.goTo('A1234AB')
    landingPage.addReleaseDatesAction().click()

    Page.verifyOnPage(StandaloneApprovedDatesReviewCalculatedDatesPage) //
      .clickContinue()

    const selectApprovedDatesTypesPage = Page.verifyOnPage(StandaloneApprovedDatesSelectDatesToEnterPage)
    selectApprovedDatesTypesPage.expectDateOffered(['APD', 'HDCAD', 'ROTL'])
    selectApprovedDatesTypesPage.checkDate('APD')
    selectApprovedDatesTypesPage.checkDate('HDCAD')
    selectApprovedDatesTypesPage.checkDate('ROTL')
    selectApprovedDatesTypesPage.continue('continue-button').click()

    Page.verifyOnPage(StandaloneEnterApprovedDatePage) //
      .checkIsFor('APD')
      .enterDate('01', '06', '2026')
      .clickContinue()

    Page.verifyOnPage(StandaloneEnterApprovedDatePage) //
      .checkIsFor('HDCAD')
      .enterDate('20', '11', '2027')
      .clickContinue()

    Page.verifyOnPage(StandaloneEnterApprovedDatePage) //
      .checkIsFor('ROTL')
      .enterDate('30', '12', '2028')
      .clickContinue()

    Page.verifyOnPage(StandaloneReviewApprovedDatesPage) //
      .expectDate('APD', '01 June 2026')
      .expectDate('HDCAD', '20 November 2027')
      .expectDate('ROTL', '30 December 2028')
      .continueButton()
      .click()

    const calculationCompletePage = Page.verifyOnPage(CalculationCompletePage)
    calculationCompletePage.title().should('contain.text', 'Calculation complete')

    cy.verifyLastAPICallDeepProperty(
      { method: 'POST', urlPath: `/calculate-release-dates/calculation/confirm/123` },
      'approvedDates',
      [
        { dateType: 'ROTL', date: { day: 30, month: 12, year: 2028 } },
        { dateType: 'HDCAD', date: { day: 20, month: 11, year: 2027 } },
        { dateType: 'APD', date: { day: 1, month: 6, year: 2026 } },
      ],
    )
  })

  it('Can add all dates and edit them if approved dates is available', () => {
    cy.task('stubAvailableApprovedDatesInputs')

    cy.signIn()
    const landingPage = CCARDLandingPage.goTo('A1234AB')
    landingPage.addReleaseDatesAction().click()

    Page.verifyOnPage(StandaloneApprovedDatesReviewCalculatedDatesPage) //
      .clickContinue()

    const selectApprovedDatesTypesPage = Page.verifyOnPage(StandaloneApprovedDatesSelectDatesToEnterPage)
    selectApprovedDatesTypesPage.expectDateOffered(['APD', 'HDCAD', 'ROTL'])
    selectApprovedDatesTypesPage.checkDate('APD')
    selectApprovedDatesTypesPage.checkDate('HDCAD')
    selectApprovedDatesTypesPage.checkDate('ROTL')
    selectApprovedDatesTypesPage.continue('continue-button').click()

    Page.verifyOnPage(StandaloneEnterApprovedDatePage) //
      .checkIsFor('APD')
      .enterDate('01', '06', '2026')
      .clickContinue()

    Page.verifyOnPage(StandaloneEnterApprovedDatePage) //
      .checkIsFor('HDCAD')
      .enterDate('20', '11', '2027')
      .clickContinue()

    Page.verifyOnPage(StandaloneEnterApprovedDatePage) //
      .checkIsFor('ROTL')
      .enterDate('30', '12', '2028')
      .clickContinue()

    Page.verifyOnPage(StandaloneReviewApprovedDatesPage) //
      .expectDate('APD', '01 June 2026')
      .expectDate('HDCAD', '20 November 2027')
      .expectDate('ROTL', '30 December 2028')
      .editDateLink('APD')
      .click()

    Page.verifyOnPage(StandaloneEnterApprovedDatePage) //
      .checkIsFor('APD')
      .clearDate()
      .enterDate('15', '07', '2025')
      .clickContinue()

    Page.verifyOnPage(StandaloneReviewApprovedDatesPage) //
      .expectDate('APD', '15 July 2025')
      .expectDate('HDCAD', '20 November 2027')
      .expectDate('ROTL', '30 December 2028')
      .continueButton()
      .click()

    const calculationCompletePage = Page.verifyOnPage(CalculationCompletePage)
    calculationCompletePage.title().should('contain.text', 'Calculation complete')

    cy.verifyLastAPICallDeepProperty(
      { method: 'POST', urlPath: `/calculate-release-dates/calculation/confirm/123` },
      'approvedDates',
      [
        { dateType: 'ROTL', date: { day: 30, month: 12, year: 2028 } },
        { dateType: 'HDCAD', date: { day: 20, month: 11, year: 2027 } },
        { dateType: 'APD', date: { day: 15, month: 7, year: 2025 } },
      ],
    )
  })

  it('Can add all dates and removed them if approved dates is available', () => {
    cy.task('stubAvailableApprovedDatesInputs')

    cy.signIn()
    const landingPage = CCARDLandingPage.goTo('A1234AB')
    landingPage.addReleaseDatesAction().click()

    Page.verifyOnPage(StandaloneApprovedDatesReviewCalculatedDatesPage) //
      .clickContinue()

    const selectApprovedDatesTypesPage = Page.verifyOnPage(StandaloneApprovedDatesSelectDatesToEnterPage)
    selectApprovedDatesTypesPage.expectDateOffered(['APD', 'HDCAD', 'ROTL'])
    selectApprovedDatesTypesPage.checkDate('APD')
    selectApprovedDatesTypesPage.checkDate('HDCAD')
    selectApprovedDatesTypesPage.checkDate('ROTL')
    selectApprovedDatesTypesPage.continue('continue-button').click()

    Page.verifyOnPage(StandaloneEnterApprovedDatePage) //
      .checkIsFor('APD')
      .enterDate('01', '06', '2026')
      .clickContinue()

    Page.verifyOnPage(StandaloneEnterApprovedDatePage) //
      .checkIsFor('HDCAD')
      .enterDate('20', '11', '2027')
      .clickContinue()

    Page.verifyOnPage(StandaloneEnterApprovedDatePage) //
      .checkIsFor('ROTL')
      .enterDate('30', '12', '2028')
      .clickContinue()

    Page.verifyOnPage(StandaloneReviewApprovedDatesPage) //
      .expectDate('APD', '01 June 2026')
      .expectDate('HDCAD', '20 November 2027')
      .expectDate('ROTL', '30 December 2028')
      .deleteDateLink('APD')
      .click()

    Page.verifyOnPage(StandaloneRemoveApprovedDatePage) //
      .checkIsFor('APD')
      .selectRadio('NO')
      .continue()
      .click()

    Page.verifyOnPage(StandaloneReviewApprovedDatesPage) //
      .expectDate('APD', '01 June 2026')
      .expectDate('HDCAD', '20 November 2027')
      .expectDate('ROTL', '30 December 2028')
      .deleteDateLink('HDCAD')
      .click()

    Page.verifyOnPage(StandaloneRemoveApprovedDatePage) //
      .checkIsFor('HDCAD')
      .selectRadio('YES')
      .continue()
      .click()

    Page.verifyOnPage(StandaloneReviewApprovedDatesPage) //
      .expectDate('APD', '01 June 2026')
      .expectDate('ROTL', '30 December 2028')
      .continueButton()
      .click()

    const calculationCompletePage = Page.verifyOnPage(CalculationCompletePage)
    calculationCompletePage.title().should('contain.text', 'Calculation complete')

    cy.verifyLastAPICallDeepProperty(
      { method: 'POST', urlPath: `/calculate-release-dates/calculation/confirm/123` },
      'approvedDates',
      [
        { dateType: 'ROTL', date: { day: 30, month: 12, year: 2028 } },
        { dateType: 'APD', date: { day: 1, month: 6, year: 2026 } },
      ],
    )
  })
})

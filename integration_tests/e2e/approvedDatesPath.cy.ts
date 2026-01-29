import CalculationCompletePage from '../pages/calculationComplete'
import CalculationSummaryPage from '../pages/calculationSummary'
import CheckInformationPage from '../pages/checkInformation'
import Page from '../pages/page'
import ApprovedDatesQuestionPage from '../pages/approvedDatesQuestion'
import CalculationReasonPage from '../pages/reasonForCalculation'
import CCARDLandingPage from '../pages/CCARDLandingPage'
import ApprovedDatesSelectDatesToEnterPage from '../pages/approvedDatesSelectDatesToEnter'
import ApprovedDatesEnterDatePage from '../pages/approvedDatesEnterDate'
import ApprovedDatesRemoveDatePage from '../pages/approvedDatesRemoveDate'

context('End to end user journeys entering and modifying approved dates', () => {
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

  it('Can add all dates', () => {
    cy.signIn()
    const landingPage = CCARDLandingPage.goTo('A1234AB')
    landingPage.calculateReleaseDatesAction().click()

    const calculationReasonPage = CalculationReasonPage.verifyOnPage(CalculationReasonPage)
    calculationReasonPage.radioByReasonId(1).check()
    calculationReasonPage.submitReason().click()

    const checkInformationPage = Page.verifyOnPage(CheckInformationPage)
    checkInformationPage.calculateButton().click()

    const calculationSummaryPage = Page.verifyOnPage(CalculationSummaryPage)
    calculationSummaryPage.agreeWithDatesRadio('YES').click()
    calculationSummaryPage.continueButton().click()

    const approvedDatesQuestionPage = Page.verifyOnPage(ApprovedDatesQuestionPage)
    approvedDatesQuestionPage.yes().click()
    approvedDatesQuestionPage.continue().click()

    const selectApprovedDatesTypesPage = Page.verifyOnPage(ApprovedDatesSelectDatesToEnterPage)
    selectApprovedDatesTypesPage.expectDateOffered(['APD', 'HDCAD', 'ROTL'])
    selectApprovedDatesTypesPage.checkDate('APD')
    selectApprovedDatesTypesPage.checkDate('HDCAD')
    selectApprovedDatesTypesPage.checkDate('ROTL')
    selectApprovedDatesTypesPage.continue().click()

    const enterApdPage = Page.verifyOnPage(ApprovedDatesEnterDatePage)
    enterApdPage.checkIsFor('APD')
    enterApdPage.enterDate('APD', '01', '06', '2026')
    enterApdPage.continue().click()

    const enterHdcadPage = Page.verifyOnPage(ApprovedDatesEnterDatePage)
    enterHdcadPage.checkIsFor('HDCAD')
    enterHdcadPage.enterDate('HDCAD', '20', '11', '2027')
    enterHdcadPage.continue().click()

    const enterRotlPage = Page.verifyOnPage(ApprovedDatesEnterDatePage)
    enterRotlPage.checkIsFor('ROTL')
    enterRotlPage.enterDate('ROTL', '30', '12', '2028')
    enterRotlPage.continue().click()

    const calculationSummaryPageAfterApprovedDates = Page.verifyOnPage(CalculationSummaryPage)
    calculationSummaryPageAfterApprovedDates.dateShouldHaveValue('APD', 'Monday, 01 June 2026')
    calculationSummaryPageAfterApprovedDates.dateShouldHaveValue('HDCAD', 'Saturday, 20 November 2027')
    calculationSummaryPageAfterApprovedDates.dateShouldHaveValue('ROTL', 'Saturday, 30 December 2028')
    calculationSummaryPageAfterApprovedDates.submitToNomisButton().click()

    const calculationCompletePage = Page.verifyOnPage(CalculationCompletePage)

    calculationCompletePage.title().should('contain.text', 'Calculation complete')
  })

  it('Can edit a date', () => {
    cy.signIn()
    const landingPage = CCARDLandingPage.goTo('A1234AB')
    landingPage.calculateReleaseDatesAction().click()

    const calculationReasonPage = CalculationReasonPage.verifyOnPage(CalculationReasonPage)
    calculationReasonPage.radioByReasonId(1).check()
    calculationReasonPage.submitReason().click()

    const checkInformationPage = Page.verifyOnPage(CheckInformationPage)
    checkInformationPage.calculateButton().click()

    const calculationSummaryPage = Page.verifyOnPage(CalculationSummaryPage)
    calculationSummaryPage.agreeWithDatesRadio('YES').click()
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
    calculationSummaryPageAfterApprovedDates.changeDateLink('APD').click()

    const editApdPage = Page.verifyOnPage(ApprovedDatesEnterDatePage)
    editApdPage.checkIsFor('APD')
    editApdPage.clearDate('APD')
    editApdPage.enterDate('APD', '01', '06', '2027')
    editApdPage.continue().click()

    const calculationSummaryPageAfterEditApd = Page.verifyOnPage(CalculationSummaryPage)
    calculationSummaryPageAfterEditApd.dateShouldHaveValue('APD', 'Tuesday, 01 June 2027')
    calculationSummaryPageAfterEditApd.submitToNomisButton().click()

    const calculationCompletePage = Page.verifyOnPage(CalculationCompletePage)
    calculationCompletePage.title().should('contain.text', 'Calculation complete')
  })

  it('Can remove a date', () => {
    cy.signIn()
    const landingPage = CCARDLandingPage.goTo('A1234AB')
    landingPage.calculateReleaseDatesAction().click()

    const calculationReasonPage = CalculationReasonPage.verifyOnPage(CalculationReasonPage)
    calculationReasonPage.radioByReasonId(1).check()
    calculationReasonPage.submitReason().click()

    const checkInformationPage = Page.verifyOnPage(CheckInformationPage)
    checkInformationPage.calculateButton().click()

    const calculationSummaryPage = Page.verifyOnPage(CalculationSummaryPage)
    calculationSummaryPage.agreeWithDatesRadio('YES').click()
    calculationSummaryPage.continueButton().click()

    const approvedDatesQuestionPage = Page.verifyOnPage(ApprovedDatesQuestionPage)
    approvedDatesQuestionPage.yes().click()
    approvedDatesQuestionPage.continue().click()

    const selectApprovedDatesTypesPage = Page.verifyOnPage(ApprovedDatesSelectDatesToEnterPage)
    selectApprovedDatesTypesPage.expectDateOffered(['APD', 'HDCAD', 'ROTL'])
    selectApprovedDatesTypesPage.checkDate('APD')
    selectApprovedDatesTypesPage.checkDate('HDCAD')
    selectApprovedDatesTypesPage.continue().click()

    const enterApdPage = Page.verifyOnPage(ApprovedDatesEnterDatePage)
    enterApdPage.checkIsFor('APD')
    enterApdPage.enterDate('APD', '01', '06', '2026')
    enterApdPage.continue().click()

    const enterHdcadPage = Page.verifyOnPage(ApprovedDatesEnterDatePage)
    enterHdcadPage.checkIsFor('HDCAD')
    enterHdcadPage.enterDate('HDCAD', '20', '11', '2027')
    enterHdcadPage.continue().click()

    const calculationSummaryPageAfterApprovedDates = Page.verifyOnPage(CalculationSummaryPage)
    calculationSummaryPageAfterApprovedDates.dateShouldHaveValue('APD', 'Monday, 01 June 2026')
    calculationSummaryPageAfterApprovedDates.dateShouldHaveValue('HDCAD', 'Saturday, 20 November 2027')
    calculationSummaryPageAfterApprovedDates.removeDateLink('APD').click()

    const removeApdPage = Page.verifyOnPage(ApprovedDatesRemoveDatePage)
    removeApdPage.yes().click()
    removeApdPage.continue().click()

    const calculationSummaryPageAfterRemoveApd = Page.verifyOnPage(CalculationSummaryPage)
    calculationSummaryPageAfterRemoveApd.dateShouldNotBePresent('APD')
    calculationSummaryPageAfterRemoveApd.dateShouldHaveValue('HDCAD', 'Saturday, 20 November 2027')
    calculationSummaryPageAfterRemoveApd.submitToNomisButton().click()

    const calculationCompletePage = Page.verifyOnPage(CalculationCompletePage)
    calculationCompletePage.title().should('contain.text', 'Calculation complete')
  })
})

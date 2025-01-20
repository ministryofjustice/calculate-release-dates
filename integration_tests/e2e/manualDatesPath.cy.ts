import Page from '../pages/page'
import CalculationReasonPage from '../pages/reasonForCalculation'
import CCARDLandingPage from '../pages/CCARDLandingPage'
import CheckInformationUnsupportedPage from '../pages/checkInformationUnsupported'
import ManualEntryLandingPage from '../pages/manualEntryLandingPage'
import ManualEntrySelectDatesPage from '../pages/manualEntrySelectDatesPage'
import ManualDatesEnterDatePage from '../pages/manualDatesEnterDatePage'
import ManualDatesConfirmationPage from '../pages/manualDatesConfirmationPage'
import CalculationCompletePage from '../pages/calculationComplete'
import ManualDatesRemoveDatePage from '../pages/manualDatesRemoveDate'

context('End to end user journeys entering and modifying approved dates', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetUserCaseloads')
    cy.task('stubGetPrisonerDetails')
    cy.task('stubGetAnalyzedSentencesAndOffences')
    cy.task('stubGetAnalyzedSentenceAdjustments')
    cy.task('stubSupportedValidationUnsupportedSentence')
    cy.task('stubGetActiveCalculationReasons')
    cy.task('stubGetCalculationHistory')
    cy.task('stubComponents')
    cy.task('stubGetLatestCalculation')
    cy.task('stubGetReferenceDates')
    cy.task('stubGetBookingManualEntryValidationNoMessages')
    cy.task('stubHasNoIndeterminateSentences')
    cy.task('stubSaveManualEntry')
    cy.task('stubGetCalculationResults')
    cy.task('stubHasNoRecallSentences')
    cy.task('stubManualEntryDateValidation')
    cy.task('stubGetServiceDefinitions')
  })

  it('Can add some manual dates', () => {
    cy.signIn()
    const landingPage = CCARDLandingPage.goTo('A1234AB')
    landingPage.calculateReleaseDatesAction().click()

    const calculationReasonPage = CalculationReasonPage.verifyOnPage(CalculationReasonPage)
    calculationReasonPage.radioByIndex(1).check()
    calculationReasonPage.submitReason().click()

    const checkInformationUnsupportedPage = Page.verifyOnPage(CheckInformationUnsupportedPage)
    checkInformationUnsupportedPage.manualEntryButton().click()

    const manualEntryLandingPage = Page.verifyOnPage(ManualEntryLandingPage)
    manualEntryLandingPage.continue().click()

    const selectDatesPage = Page.verifyOnPage(ManualEntrySelectDatesPage)
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
    selectDatesPage.checkDate('LED')
    selectDatesPage.checkDate('CRD')
    selectDatesPage.checkDate('MTD')
    selectDatesPage.continue().click()

    const enterSedPage = Page.verifyOnPage(ManualDatesEnterDatePage)
    enterSedPage.checkIsFor('LED')
    enterSedPage.enterDate('LED', '01', '06', '2026')
    enterSedPage.continue().click()

    const enterCRDPage = Page.verifyOnPage(ManualDatesEnterDatePage)
    enterCRDPage.checkIsFor('CRD')
    enterCRDPage.enterDate('CRD', '03', '09', '2027')
    enterCRDPage.continue().click()

    const enterMTDPage = Page.verifyOnPage(ManualDatesEnterDatePage)
    enterMTDPage.checkIsFor('MTD')
    enterMTDPage.enterDate('MTD', '09', '03', '2028')
    enterMTDPage.continue().click()

    const manualDatesConfirmationPage = Page.verifyOnPage(ManualDatesConfirmationPage)
    manualDatesConfirmationPage.dateShouldHaveValue('LED', '01 June 2026')
    manualDatesConfirmationPage.dateShouldHaveValue('CRD', '03 September 2027')
    manualDatesConfirmationPage.dateShouldHaveValue('MTD', '09 March 2028')
    // check unselected dates are not shown
    manualDatesConfirmationPage.dateShouldNotBePresent('LTD')
    manualDatesConfirmationPage.submitToNomisButton().click()

    const calculationCompletePage = Page.verifyOnPage(CalculationCompletePage)

    calculationCompletePage.title().should('contain.text', 'Calculation complete')
  })

  it('Can add extra dates after initial selection', () => {
    cy.signIn()
    const landingPage = CCARDLandingPage.goTo('A1234AB')
    landingPage.calculateReleaseDatesAction().click()

    const calculationReasonPage = CalculationReasonPage.verifyOnPage(CalculationReasonPage)
    calculationReasonPage.radioByIndex(1).check()
    calculationReasonPage.submitReason().click()

    const checkInformationUnsupportedPage = Page.verifyOnPage(CheckInformationUnsupportedPage)
    checkInformationUnsupportedPage.manualEntryButton().click()

    const manualEntryLandingPage = Page.verifyOnPage(ManualEntryLandingPage)
    manualEntryLandingPage.continue().click()

    const selectDatesPage = Page.verifyOnPage(ManualEntrySelectDatesPage)
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
    selectDatesPage.checkDate('CRD')
    selectDatesPage.continue().click()

    const enterCRDPage = Page.verifyOnPage(ManualDatesEnterDatePage)
    enterCRDPage.checkIsFor('CRD')
    enterCRDPage.enterDate('CRD', '03', '09', '2027')
    enterCRDPage.continue().click()

    const manualDatesConfirmationPage = Page.verifyOnPage(ManualDatesConfirmationPage)
    manualDatesConfirmationPage.dateShouldHaveValue('CRD', '03 September 2027')
    manualDatesConfirmationPage.dateShouldNotBePresent('SED')
    manualDatesConfirmationPage.dateShouldNotBePresent('MTD')
    manualDatesConfirmationPage.addAnotherReleaseDateLink().click()

    const selectMoreDatesPage = Page.verifyOnPage(ManualEntrySelectDatesPage)
    selectMoreDatesPage.checkDate('SED')
    selectMoreDatesPage.continue().click()

    const enterSedPage = Page.verifyOnPage(ManualDatesEnterDatePage)
    enterSedPage.checkIsFor('SED')
    enterSedPage.enterDate('SED', '01', '06', '2026')
    enterSedPage.continue().click()

    const manualDateConfAfterAddingSed = Page.verifyOnPage(ManualDatesConfirmationPage)
    manualDateConfAfterAddingSed.dateShouldHaveValue('CRD', '03 September 2027')
    manualDateConfAfterAddingSed.dateShouldHaveValue('SED', '01 June 2026')
    manualDateConfAfterAddingSed.dateShouldNotBePresent('MTD')
    manualDateConfAfterAddingSed.submitToNomisButton().click()

    const calculationCompletePage = Page.verifyOnPage(CalculationCompletePage)

    calculationCompletePage.title().should('contain.text', 'Calculation complete')
  })

  it('Can edit dates', () => {
    cy.signIn()
    const landingPage = CCARDLandingPage.goTo('A1234AB')
    landingPage.calculateReleaseDatesAction().click()

    const calculationReasonPage = CalculationReasonPage.verifyOnPage(CalculationReasonPage)
    calculationReasonPage.radioByIndex(1).check()
    calculationReasonPage.submitReason().click()

    const checkInformationUnsupportedPage = Page.verifyOnPage(CheckInformationUnsupportedPage)
    checkInformationUnsupportedPage.manualEntryButton().click()

    const manualEntryLandingPage = Page.verifyOnPage(ManualEntryLandingPage)
    manualEntryLandingPage.continue().click()

    const selectDatesPage = Page.verifyOnPage(ManualEntrySelectDatesPage)
    selectDatesPage.checkDate('SED')
    selectDatesPage.checkDate('CRD')
    selectDatesPage.continue().click()

    const enterSedPage = Page.verifyOnPage(ManualDatesEnterDatePage)
    enterSedPage.checkIsFor('SED')
    enterSedPage.enterDate('SED', '01', '06', '2026')
    enterSedPage.continue().click()

    const enterCRDPage = Page.verifyOnPage(ManualDatesEnterDatePage)
    enterCRDPage.checkIsFor('CRD')
    enterCRDPage.enterDate('CRD', '03', '09', '2027')
    enterCRDPage.continue().click()

    const manualDatesConfirmationPage = Page.verifyOnPage(ManualDatesConfirmationPage)
    manualDatesConfirmationPage.dateShouldHaveValue('CRD', '03 September 2027')
    manualDatesConfirmationPage.dateShouldHaveValue('SED', '01 June 2026')
    manualDatesConfirmationPage.dateShouldNotBePresent('MTD')
    manualDatesConfirmationPage.editReleaseDateLink('SED').click()

    const editSedPage = Page.verifyOnPage(ManualDatesEnterDatePage)
    editSedPage.checkIsFor('SED')
    editSedPage.clearDate('SED')
    editSedPage.enterDate('SED', '02', '07', '2029')
    editSedPage.continue().click()

    const manualDateAfterEdit = Page.verifyOnPage(ManualDatesConfirmationPage)
    manualDateAfterEdit.dateShouldHaveValue('CRD', '03 September 2027')
    manualDateAfterEdit.dateShouldHaveValue('SED', '02 July 2029')
    manualDateAfterEdit.dateShouldNotBePresent('MTD')
    manualDateAfterEdit.submitToNomisButton().click()

    const calculationCompletePage = Page.verifyOnPage(CalculationCompletePage)

    calculationCompletePage.title().should('contain.text', 'Calculation complete')
  })
  it('Can remove dates', () => {
    cy.signIn()
    const landingPage = CCARDLandingPage.goTo('A1234AB')
    landingPage.calculateReleaseDatesAction().click()

    const calculationReasonPage = CalculationReasonPage.verifyOnPage(CalculationReasonPage)
    calculationReasonPage.radioByIndex(1).check()
    calculationReasonPage.submitReason().click()

    const checkInformationUnsupportedPage = Page.verifyOnPage(CheckInformationUnsupportedPage)
    checkInformationUnsupportedPage.manualEntryButton().click()

    const manualEntryLandingPage = Page.verifyOnPage(ManualEntryLandingPage)
    manualEntryLandingPage.continue().click()

    const selectDatesPage = Page.verifyOnPage(ManualEntrySelectDatesPage)
    selectDatesPage.checkDate('SED')
    selectDatesPage.checkDate('CRD')
    selectDatesPage.continue().click()

    const enterSedPage = Page.verifyOnPage(ManualDatesEnterDatePage)
    enterSedPage.checkIsFor('SED')
    enterSedPage.enterDate('SED', '01', '06', '2026')
    enterSedPage.continue().click()

    const enterCRDPage = Page.verifyOnPage(ManualDatesEnterDatePage)
    enterCRDPage.checkIsFor('CRD')
    enterCRDPage.enterDate('CRD', '03', '09', '2027')
    enterCRDPage.continue().click()

    const manualDatesConfirmationPage = Page.verifyOnPage(ManualDatesConfirmationPage)
    manualDatesConfirmationPage.dateShouldHaveValue('CRD', '03 September 2027')
    manualDatesConfirmationPage.dateShouldHaveValue('SED', '01 June 2026')
    manualDatesConfirmationPage.removeReleaseDateLink('SED').click()

    const removeSedPage = Page.verifyOnPage(ManualDatesRemoveDatePage)
    removeSedPage.yes().click()
    removeSedPage.continue().click()

    const manualDateAfterEdit = Page.verifyOnPage(ManualDatesConfirmationPage)
    manualDateAfterEdit.dateShouldHaveValue('CRD', '03 September 2027')
    manualDatesConfirmationPage.dateShouldNotBePresent('SED')
    manualDateAfterEdit.submitToNomisButton().click()

    const calculationCompletePage = Page.verifyOnPage(CalculationCompletePage)

    calculationCompletePage.title().should('contain.text', 'Calculation complete')
  })
})

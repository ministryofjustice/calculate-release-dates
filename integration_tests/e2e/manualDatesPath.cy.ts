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
import ManualDatesNoDatesConfirmationPage from '../pages/manualDatesNoDatesConfirmationPage'

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
    cy.task('stubExistingManualJourney', false)
    cy.task('stubManualEntryDateValidation')
    cy.task('stubGetServiceDefinitions')
    cy.task('stubGetEligibility')
  })

  it('Can add some manual dates when there are no indeterminate sentences', () => {
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

  it('Can submit no dates for indeterminate sentences', () => {
    cy.task('stubHasSomeIndeterminateSentences')
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
    selectDatesPage.expectDateOffered(['Tariff', 'TERSED', 'ROTL', 'APD', 'PED', 'None'])
    selectDatesPage.checkDate('PED')
    selectDatesPage.continue().click()

    const enterPEDPage = Page.verifyOnPage(ManualDatesEnterDatePage)
    enterPEDPage.checkIsFor('PED')
    enterPEDPage.enterDate('PED', '09', '03', '2028')
    enterPEDPage.continue().click()

    const manualDatesConfirmationPage = Page.verifyOnPage(ManualDatesConfirmationPage)
    manualDatesConfirmationPage.dateShouldHaveValue('PED', '09 March 2028')

    const addAnotherDate = manualDatesConfirmationPage.addAnotherDatesLink()
    addAnotherDate.click()

    const selectDatesPageReturn = Page.verifyOnPage(ManualEntrySelectDatesPage)
    selectDatesPageReturn.expectDateOffered(['Tariff', 'TERSED', 'ROTL', 'APD', 'PED', 'None'])
    selectDatesPageReturn.checkDate('None')
    selectDatesPageReturn.continue().click()

    const confirmationPage = Page.verifyOnPage(ManualDatesNoDatesConfirmationPage)
    confirmationPage.confirm()
    confirmationPage.continue()

    const calculationCompletePage = Page.verifyOnPage(CalculationCompletePage)
    calculationCompletePage.title().should('contain.text', 'No release dates have been saved for')
  })

  it('Can add some manual dates when there are some indeterminate sentences', () => {
    cy.task('stubHasSomeIndeterminateSentences')
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
    selectDatesPage.expectDateOffered(['Tariff', 'TERSED', 'ROTL', 'APD', 'PED', 'None'])
    selectDatesPage.checkDate('Tariff')
    selectDatesPage.checkDate('ROTL')
    selectDatesPage.checkDate('PED')
    selectDatesPage.continue().click()

    const enterSedPage = Page.verifyOnPage(ManualDatesEnterDatePage)
    enterSedPage.checkIsFor('Tariff')
    enterSedPage.enterDate('Tariff', '01', '06', '2026')
    enterSedPage.continue().click()

    const enterCRDPage = Page.verifyOnPage(ManualDatesEnterDatePage)
    enterCRDPage.checkIsFor('ROTL')
    enterCRDPage.enterDate('ROTL', '03', '09', '2027')
    enterCRDPage.continue().click()

    const enterMTDPage = Page.verifyOnPage(ManualDatesEnterDatePage)
    enterMTDPage.checkIsFor('PED')
    enterMTDPage.enterDate('PED', '09', '03', '2028')
    enterMTDPage.continue().click()

    const manualDatesConfirmationPage = Page.verifyOnPage(ManualDatesConfirmationPage)
    manualDatesConfirmationPage.dateShouldHaveValue('Tariff', '01 June 2026')
    manualDatesConfirmationPage.dateShouldHaveValue('ROTL', '03 September 2027')
    manualDatesConfirmationPage.dateShouldHaveValue('PED', '09 March 2028')
    // check unselected dates are not shown
    manualDatesConfirmationPage.dateShouldNotBePresent('TERSED')
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

  describe('Express Manual Journey', () => {
    it('Confirming dates are unchanged creates new calculation using existing dates', () => {
      cy.task('stubExistingManualJourney', true)
      cy.signIn()

      const landingPage = CCARDLandingPage.goTo('A1234AB')
      landingPage.calculateReleaseDatesAction().click()

      const calculationReasonPage = CalculationReasonPage.verifyOnPage(CalculationReasonPage)
      calculationReasonPage.radioByIndex(1).check()
      calculationReasonPage.submitReason().click()

      const checkInformationUnsupportedPage = Page.verifyOnPage(CheckInformationUnsupportedPage)
      checkInformationUnsupportedPage.manualEntryButton().click()

      const manualEntryLandingPage = Page.verifyOnPage(ManualEntryLandingPage)
      manualEntryLandingPage
        .mainContent()
        .should(
          'contain.text',
          'As no information has changed for this calculation, you need to confirm that the manually calculated release dates are correct.',
        )

      manualEntryLandingPage.continue().click()
      const manualDatePage = Page.verifyOnPage(ManualDatesConfirmationPage)

      manualDatePage.expressJourneyChangedDatesConfirmationExists()
      manualDatePage.expressJourneyHasImmutableDates(false)
      manualDatePage.expressJourneyConfirmNoChanges()
      manualDatePage.expressJourneyConfirmChoice()

      const calculationCompletePage = Page.verifyOnPage(CalculationCompletePage)

      calculationCompletePage.title().should('contain.text', 'Calculation complete')
    })

    it('Confirming dates have changed shows edit and remove date options', () => {
      cy.task('stubExistingManualJourney', true)
      cy.signIn()

      const landingPage = CCARDLandingPage.goTo('A1234AB')
      landingPage.calculateReleaseDatesAction().click()

      const calculationReasonPage = CalculationReasonPage.verifyOnPage(CalculationReasonPage)
      calculationReasonPage.radioByIndex(1).check()
      calculationReasonPage.submitReason().click()

      const checkInformationUnsupportedPage = Page.verifyOnPage(CheckInformationUnsupportedPage)
      checkInformationUnsupportedPage.manualEntryButton().click()

      const manualEntryLandingPage = Page.verifyOnPage(ManualEntryLandingPage)
      manualEntryLandingPage
        .mainContent()
        .should(
          'contain.text',
          'As no information has changed for this calculation, you need to confirm that the manually calculated release dates are correct.',
        )

      manualEntryLandingPage.continue().click()
      const manualDatePage = Page.verifyOnPage(ManualDatesConfirmationPage)
      manualDatePage.expressJourneyChangedDatesConfirmationExists()
      manualDatePage.expressJourneyHasImmutableDates(false)
      manualDatePage.expressJourneyConfirmChanges()
      manualDatePage.expressJourneyConfirmChoice()

      const manualDatePageWithEditableDates = Page.verifyOnPage(ManualDatesConfirmationPage)
      manualDatePageWithEditableDates.expressJourneyHasImmutableDates(true)
      manualDatePageWithEditableDates.expressJourneyShowsPaperCalculationTitle()

      manualDatePageWithEditableDates.addAnotherDatesLink().should('exist')

      manualDatePageWithEditableDates.editReleaseDateLink('SLED').should('exist')
      manualDatePageWithEditableDates.removeReleaseDateLink('SLED').should('exist')
      manualDatePageWithEditableDates.editReleaseDateLink('CRD').should('exist')
      manualDatePageWithEditableDates.removeReleaseDateLink('CRD').should('exist')
      manualDatePageWithEditableDates.editReleaseDateLink('HDCED').should('exist')
      manualDatePageWithEditableDates.removeReleaseDateLink('HDCED').should('exist')

      manualDatePageWithEditableDates.addAnotherReleaseDateLink().click()

      const selectMoreDatesPage = Page.verifyOnPage(ManualEntrySelectDatesPage)
      selectMoreDatesPage.backLinkExistsWithTitle('/calculation/A1234AB/manual-entry/confirmation')
      selectMoreDatesPage.checkDate('SED')
      selectMoreDatesPage.checkDate('LED')
      selectMoreDatesPage.continue().click()

      const enterSedPage = Page.verifyOnPage(ManualDatesEnterDatePage)
      enterSedPage.checkIsFor('SED')
      enterSedPage.enterDate('SED', '01', '06', '2026')
      enterSedPage.continue().click()

      const enterLedPage = Page.verifyOnPage(ManualDatesEnterDatePage)
      enterLedPage.backLinkExistsWithTitle('/calculation/A1234AB/manual-entry/enter-date?dateType=SED')
      enterLedPage.backButton().click()

      const enterSedReturnPage = Page.verifyOnPage(ManualDatesEnterDatePage)
      enterSedReturnPage.checkIsFor('SED')
      enterSedReturnPage.clearDate('SED')
      enterSedReturnPage.enterDate('SED', '01', '06', '2028')
      enterSedReturnPage.continue().click()

      const enterLedReturnPage = Page.verifyOnPage(ManualDatesEnterDatePage)
      enterLedReturnPage.backLinkExistsWithTitle('/calculation/A1234AB/manual-entry/enter-date?dateType=SED')
      enterLedReturnPage.checkIsFor('LED')
      enterLedReturnPage.enterDate('LED', '02', '02', '2030')
      enterLedReturnPage.continue().click()

      const manualDateReturnPageWithEditableDates = Page.verifyOnPage(ManualDatesConfirmationPage)
      manualDateReturnPageWithEditableDates.dateShouldHaveValue('SED', '01 June 2028')
      manualDateReturnPageWithEditableDates.dateShouldHaveValue('LED', '02 February 2030')
      manualDateReturnPageWithEditableDates.submitToNomisButton().click()

      const calculationCompletePage = Page.verifyOnPage(CalculationCompletePage)

      calculationCompletePage.title().should('contain.text', 'Calculation complete')
    })
  })
})

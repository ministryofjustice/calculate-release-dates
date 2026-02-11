import CalculationCompletePage from '../pages/calculationComplete'
import CalculationSummaryPage from '../pages/calculationSummary'
import CheckInformationPage from '../pages/checkInformation'
import Page from '../pages/page'
import PrisonerSearchPage from '../pages/prisonerSearch'
import ViewCalculationSummary from '../pages/viewCalculationSummary'
import ViewSentencesAndOffencesPage from '../pages/viewSentencesAndOffences'
import ApprovedDatesQuestionPage from '../pages/approvedDatesQuestion'
import CancelQuestionPage from '../pages/cancelQuestion'
import CalculationReasonPage from '../pages/reasonForCalculation'
import CCARDLandingPage from '../pages/CCARDLandingPage'

context('End to end happy path of user journey', () => {
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
    cy.task('stubAdjustmentsUsingAdjustmentsApi')
    cy.task('stubGetAnalyzedSentenceAdjustments')
    cy.task('stubGetAdjustmentsForPrisoner')
    cy.task('stubSentencesAndOffences')
    cy.task('stubPrisonerDetails')
    cy.task('stubLatestCalculation')
    cy.task('stubSupportedValidationNoMessages')
    cy.task('stubGetActiveCalculationReasons')
    cy.task('stubGetCalculationHistory')
    cy.task('stubGetDetailedCalculationResults')
    cy.task('stubComponents')
    cy.task('stubGetLatestCalculation')
    cy.task('stubHasNoIndeterminateSentences')
    cy.task('stubGetServiceDefinitions')
    cy.task('stubGetEligibility')
  })

  it('Standalone user journey with a standard reason', () => {
    cy.signIn()

    const prisonerSearchPage = Page.verifyOnPage(PrisonerSearchPage)
    prisonerSearchPage.searchForFirstName('Marvin')
    prisonerSearchPage.prisonerLinkFor('A1234AB').click()

    const ccardLandingPage = Page.verifyOnPage(CCARDLandingPage)
    ccardLandingPage.hasMiniProfile()
    ccardLandingPage.calculateReleaseDatesAction().click()

    const calculationReasonPage = CalculationReasonPage.verifyOnPage(CalculationReasonPage)
    calculationReasonPage.radioByReasonId(1).check()
    calculationReasonPage.hasMiniProfile()
    calculationReasonPage.submitReason().click()

    const checkInformationPage = Page.verifyOnPage(CheckInformationPage)
    checkInformationPage.calculateButton().click()
    checkInformationPage.hasMiniProfile()

    const calculationSummaryPage = Page.verifyOnPage(CalculationSummaryPage)
    calculationSummaryPage.agreeWithDatesRadio('YES').click()
    calculationSummaryPage.continueButton().click()

    const approvedDatesQuestionPage = Page.verifyOnPage(ApprovedDatesQuestionPage)
    approvedDatesQuestionPage.no().click()
    approvedDatesQuestionPage.continue().click()

    const calculationCompletePage = Page.verifyOnPage(CalculationCompletePage)

    calculationCompletePage.title().should('contain.text', 'Calculation complete')
    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: `/calculate-release-dates/calculation/A1234AB`,
      },
      {
        calculationUserInputs: {
          sentenceCalculationUserInputs: [],
          calculateErsed: false,
          usePreviouslyRecordedSLEDIfFound: true,
        },
        calculationReasonId: 1,
      },
    )
  })

  it('Standalone user journey with further details reason', () => {
    cy.signIn()

    const prisonerSearchPage = Page.verifyOnPage(PrisonerSearchPage)
    prisonerSearchPage.searchForFirstName('Marvin')
    prisonerSearchPage.prisonerLinkFor('A1234AB').click()

    const ccardLandingPage = Page.verifyOnPage(CCARDLandingPage)
    ccardLandingPage.calculateReleaseDatesAction().click()

    const calculationReasonPage = CalculationReasonPage.verifyOnPage(CalculationReasonPage)
    calculationReasonPage.radioByReasonId(75).check()
    calculationReasonPage.furtherDetailByReasonId(75).type('Some legislative change')
    calculationReasonPage.submitReason().click()

    const checkInformationPage = Page.verifyOnPage(CheckInformationPage)
    checkInformationPage.calculateButton().click()

    const calculationSummaryPage = Page.verifyOnPage(CalculationSummaryPage)
    calculationSummaryPage.agreeWithDatesRadio('YES').click()
    calculationSummaryPage.continueButton().click()

    const approvedDatesQuestionPage = Page.verifyOnPage(ApprovedDatesQuestionPage)
    approvedDatesQuestionPage.no().click()
    approvedDatesQuestionPage.continue().click()

    const calculationCompletePage = Page.verifyOnPage(CalculationCompletePage)

    calculationCompletePage.title().should('contain.text', 'Calculation complete')
    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: `/calculate-release-dates/calculation/A1234AB`,
      },
      {
        calculationUserInputs: {
          sentenceCalculationUserInputs: [],
          calculateErsed: false,
          usePreviouslyRecordedSLEDIfFound: true,
        },
        calculationReasonId: 75,
        otherReasonDescription: 'Some legislative change',
      },
    )
  })

  it('DPS user journey with selecting no in cancel question', () => {
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
    approvedDatesQuestionPage.no().click()
    approvedDatesQuestionPage.cancel().click()

    const cancelQuestionPage = Page.verifyOnPage(CancelQuestionPage)
    cancelQuestionPage.noOption().check()
    cancelQuestionPage.confirm().click()

    const approvedDatesQuestionPage1 = Page.verifyOnPage(ApprovedDatesQuestionPage)
    approvedDatesQuestionPage1.no().click()
    approvedDatesQuestionPage.continue().click()

    const calculationCompletePage = Page.verifyOnPage(CalculationCompletePage)

    calculationCompletePage.title().should('contain.text', 'Calculation complete')
  })

  it('DPS user journey with selecting yes in cancel question', () => {
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
    approvedDatesQuestionPage.no().click()
    approvedDatesQuestionPage.cancel().click()

    const cancelQuestionPage = Page.verifyOnPage(CancelQuestionPage)
    cancelQuestionPage.yesOption().check()
    cancelQuestionPage.confirm().click()
  })

  it('View journey', () => {
    cy.signIn()

    const prisonerSearchPage = Page.verifyOnPage(PrisonerSearchPage)
    prisonerSearchPage.searchForFirstName('Marvin')
    prisonerSearchPage.prisonerLinkFor('A1234AB').click()

    const landingPage = Page.verifyOnPage(CCARDLandingPage)

    landingPage
      .latestCalculationDate()
      .invoke('text')
      .then(text => {
        expect(text.trim()).to.equal('05 March 2024')
      })

    landingPage
      .latestCalculationReason()
      .invoke('text')
      .then(text => {
        expect(text.trim()).to.equal('Transfer')
      })

    landingPage
      .latestCalculationCalculatedBy()
      .invoke('text')
      .then(text => {
        expect(text.trim()).to.equal('User One at Kirkham (HMP)')
      })

    landingPage
      .latestCalculationSource()
      .invoke('text')
      .then(text => {
        expect(text.trim()).to.equal('Calculate release dates service')
      })

    landingPage.navigateToSentenceDetailsAction().click()

    const checkInformationPage = Page.verifyOnPage(ViewSentencesAndOffencesPage)
    checkInformationPage.offenceTitle('123').should('have.text', '123 - Doing a crime')
    checkInformationPage.remandTable().should('contain.text', 'Remand')
    checkInformationPage.remandTable().should('contain.text', '28')
    checkInformationPage.loadCalculationSummary().click()

    const calculationSummaryPage = Page.verifyOnPage(ViewCalculationSummary)
    calculationSummaryPage.loadSentenceAndOffences()

    calculationSummaryPage
      .getCRDDateHintText()
      .invoke('text')
      .then(text => {
        expect(text.trim()).to.equal('Manually overridden')
      })

    calculationSummaryPage.getSentenceFaq().should('exist')
    calculationSummaryPage.getCalculationOverrides().should('not.exist')
  })

  it('View journey with genuine override', () => {
    cy.signIn()
    cy.task('stubGetDetailedCalculationResults', {
      calculationType: 'GENUINE_OVERRIDE',
      overridesCalculationRequestId: 987654,
    })

    const prisonerSearchPage = Page.verifyOnPage(PrisonerSearchPage)
    prisonerSearchPage.searchForFirstName('Marvin')
    prisonerSearchPage.prisonerLinkFor('A1234AB').click()

    const landingPage = Page.verifyOnPage(CCARDLandingPage)

    landingPage
      .latestCalculationDate()
      .invoke('text')
      .then(text => {
        expect(text.trim()).to.equal('05 March 2024')
      })

    landingPage
      .latestCalculationReason()
      .invoke('text')
      .then(text => {
        expect(text.trim()).to.equal('Transfer')
      })

    landingPage
      .latestCalculationCalculatedBy()
      .invoke('text')
      .then(text => {
        expect(text.trim()).to.equal('User One at Kirkham (HMP)')
      })

    landingPage
      .latestCalculationSource()
      .invoke('text')
      .then(text => {
        expect(text.trim()).to.equal('Calculate release dates service')
      })

    landingPage.navigateToSentenceDetailsAction().click()

    const checkInformationPage = Page.verifyOnPage(ViewSentencesAndOffencesPage)
    checkInformationPage.offenceTitle('123').should('have.text', '123 - Doing a crime')
    checkInformationPage.remandTable().should('contain.text', 'Remand')
    checkInformationPage.remandTable().should('contain.text', '28')
    checkInformationPage.loadCalculationSummary().click()

    const calculationSummaryPage = Page.verifyOnPage(ViewCalculationSummary)
    calculationSummaryPage.loadSentenceAndOffences()

    calculationSummaryPage
      .getCRDDateHintText()
      .invoke('text')
      .then(text => {
        expect(text.trim()).to.equal('Manually overridden')
      })

    calculationSummaryPage.getSentenceFaq().should('not.exist')
    calculationSummaryPage.getCalculationOverrides().should('exist')
  })
})

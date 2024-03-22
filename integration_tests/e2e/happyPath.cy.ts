import AlternativeReleaseIntroPage from '../pages/alternativeReleaseIntro'
import CalculationCompletePage from '../pages/calculationComplete'
import CalculationSummaryPage from '../pages/calculationSummary'
import CheckInformationPage from '../pages/checkInformation'
import Page from '../pages/page'
import PrisonerSearchPage from '../pages/prisonerSearch'
import SelectOffencesPage from '../pages/selectOffences'
import ViewCalculationSummary from '../pages/viewCalculationSummary'
import ViewSentencesAndOffencesPage from '../pages/viewSentencesAndOffences'
import ApprovedDatesQuestionPage from '../pages/approvedDatesQuestion'
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
    cy.task('stubGetAnalyzedSentenceAdjustments')
    cy.task('stubSentencesAndOffences')
    cy.task('stubPrisonerDetails')
    cy.task('stubLatestCalculation')
    cy.task('stubCalculationQuestions')
    cy.task('stubCalculationUserInputs')
    cy.task('stubSupportedValidation')
    cy.task('stubGetGenuineOverride')
    cy.task('stubGetActiveCalculationReasons')
    cy.task('stubGetCalculationHistory')
    cy.task('stubGetDetailedCalculationResults')
    cy.task('stubComponents')
    cy.task('stubGetLatestCalculation')
  })

  it('Standalone user journey', () => {
    cy.signIn()

    const prisonerSearchPage = Page.verifyOnPage(PrisonerSearchPage)
    prisonerSearchPage.searchForFirstName('Marvin')
    prisonerSearchPage.prisonerLinkFor('A1234AB').click()

    const ccardLandingPage = Page.verifyOnPage(CCARDLandingPage)
    ccardLandingPage.hasMiniProfile()
    ccardLandingPage.calculateReleaseDatesAction().click()

    const calculationReasonPage = CalculationReasonPage.verifyOnPage(CalculationReasonPage)
    calculationReasonPage.radioByIndex(1).check()
    calculationReasonPage.hasMiniProfile()
    calculationReasonPage.submitReason().click()

    const alternativeReleaseIntro = AlternativeReleaseIntroPage.verifyOnPage(AlternativeReleaseIntroPage)
    alternativeReleaseIntro.continueButton().click()

    const listAPage = SelectOffencesPage.verifyOnPage<SelectOffencesPage>(SelectOffencesPage, 'list-a')
    listAPage.checkboxByIndex(0).click()
    listAPage.continueButton().click()
    const listCPage = SelectOffencesPage.verifyOnPage<SelectOffencesPage>(SelectOffencesPage, 'list-c')
    listCPage.noneSelectedCheckbox().click()
    listCPage.continueButton().click()

    const checkInformationPage = Page.verifyOnPage(CheckInformationPage)
    checkInformationPage.calculateButton().click()
    checkInformationPage.hasMiniProfile()

    const calculationSummaryPage = Page.verifyOnPage(CalculationSummaryPage)
    calculationSummaryPage.submitToNomisButton().click()

    const approvedDatesQuestionPage = Page.verifyOnPage(ApprovedDatesQuestionPage)
    approvedDatesQuestionPage.no().click()
    approvedDatesQuestionPage.continue().click()

    const calculationCompletePage = Page.verifyOnPage(CalculationCompletePage)

    calculationCompletePage
      .title()
      .should('contain.text', 'Release dates saved to NOMIS for')
      .should('contain.text', 'Marvin Haggler')
  })

  it('DPS user journey', () => {
    cy.signIn()
    const landingPage = CCARDLandingPage.goTo('A1234AB')
    landingPage.calculateReleaseDatesAction().click()

    const calculationReasonPage = CalculationReasonPage.verifyOnPage(CalculationReasonPage)
    calculationReasonPage.radioByIndex(1).check()
    calculationReasonPage.submitReason().click()

    const alternativeReleaseIntro = AlternativeReleaseIntroPage.verifyOnPage(AlternativeReleaseIntroPage)
    alternativeReleaseIntro.continueButton().click()

    const listAPage = SelectOffencesPage.verifyOnPage<SelectOffencesPage>(SelectOffencesPage, 'list-a')
    listAPage.checkboxByIndex(0).click()
    listAPage.continueButton().click()
    const listCPage = SelectOffencesPage.verifyOnPage<SelectOffencesPage>(SelectOffencesPage, 'list-c')
    listCPage.noneSelectedCheckbox().click()
    listCPage.continueButton().click()
    const checkInformationPage = Page.verifyOnPage(CheckInformationPage)
    checkInformationPage.calculateButton().click()

    const calculationSummaryPage = Page.verifyOnPage(CalculationSummaryPage)
    calculationSummaryPage.submitToNomisButton().click()

    const approvedDatesQuestionPage = Page.verifyOnPage(ApprovedDatesQuestionPage)
    approvedDatesQuestionPage.no().click()
    approvedDatesQuestionPage.continue().click()

    const calculationCompletePage = Page.verifyOnPage(CalculationCompletePage)

    calculationCompletePage
      .title()
      .should('contain.text', 'Release dates saved to NOMIS for')
      .should('contain.text', 'Marvin Haggler')
  })

  it('View journey', () => {
    cy.signIn()

    const prisonerSearchPage = Page.verifyOnPage(PrisonerSearchPage)
    prisonerSearchPage.searchForFirstName('Marvin')
    prisonerSearchPage.prisonerLinkFor('A1234AB').click()

    const ccardLandingPage = Page.verifyOnPage(CCARDLandingPage)
    ccardLandingPage.latestCalcViewDetailsAction().click()

    const checkInformationPage = Page.verifyOnPage(ViewSentencesAndOffencesPage)
    checkInformationPage.offenceCountText().contains('This calculation will include 2 sentences from NOMIS.')
    checkInformationPage.nextPage().click()

    const calculationSummaryPage = Page.verifyOnPage(ViewCalculationSummary)
    calculationSummaryPage.previousPage()
  })
})

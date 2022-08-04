import IndexPage from '../../integration_tests/pages'
import AlternativeReleaseIntroPage from '../../integration_tests/pages/alternativeReleaseIntro'
import CalculationCompletePage from '../../integration_tests/pages/calculationComplete'
import CalculationSummaryPage from '../../integration_tests/pages/calculationSummary'
import CheckInformationPage from '../../integration_tests/pages/checkInformation'
import Page from '../../integration_tests/pages/page'
import PrisonerSearchPage from '../../integration_tests/pages/prisonerSearch'
import SelectOffencesPage from '../../integration_tests/pages/selectOffences'
import ViewCalculationSummary from '../../integration_tests/pages/viewCalculationSummary'
import ViewSentencesAndOffencesPage from '../../integration_tests/pages/viewSentencesAndOffences'

context('End to end happy path of user journey', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubPrisonerSearch')
    cy.task('stubGetUserCaseloads')
    cy.task('stubGetPrisonerDetails')
    cy.task('stubGetSentencesAndOffences')
    cy.task('stubGetSentenceAdjustments')
    cy.task('stubCalculatePreliminaryReleaseDates')
    cy.task('stubGetCalculationResults')
    cy.task('stubGetCalculationBreakdown')
    cy.task('stubConfirmCalculation')
    cy.task('stubGetNextWorkingDay')
    cy.task('stubGetPreviousWorkingDay')
    cy.task('stubValidate')
    cy.task('stubAdjustments')
    cy.task('stubSentencesAndOffences')
    cy.task('stubPrisonerDetails')
    cy.task('stubLatestCalculation')
    cy.task('stubCalculationQuestions')
    cy.task('stubCalculationUserInputs')
  })

  it('Standalone user journey', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.startNowButton().click()

    const prisonerSearchPage = Page.verifyOnPage(PrisonerSearchPage)
    prisonerSearchPage.searchForFirstName('Marvin')
    prisonerSearchPage.prisonerLinkFor('A1234AB').click()

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

    const calculationCompletePage = Page.verifyOnPage(CalculationCompletePage)

    calculationCompletePage
      .title()
      .should('contain.text', 'Calculation complete for')
      .should('contain.text', 'Marvin Haggler')
  })

  it('DPS user journey', () => {
    cy.signIn()
    const indexPage = IndexPage.goTo('A1234AB')
    indexPage.startNowButton().click()

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

    const calculationCompletePage = Page.verifyOnPage(CalculationCompletePage)

    calculationCompletePage
      .title()
      .should('contain.text', 'Calculation complete for')
      .should('contain.text', 'Marvin Haggler')
  })

  it('View journey', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.viewJourneyLink().click()

    const prisonerSearchPage = Page.verifyOnPage(PrisonerSearchPage)
    prisonerSearchPage.searchForFirstName('Marvin')
    prisonerSearchPage.prisonerLinkFor('A1234AB').click()

    const checkInformationPage = Page.verifyOnPage(ViewSentencesAndOffencesPage)
    checkInformationPage.offenceCountText().contains('This calculation will include 2 sentences from NOMIS.')
    checkInformationPage.nextPage().click()

    const calculationSummaryPage = Page.verifyOnPage(ViewCalculationSummary)
    calculationSummaryPage.previousPage()
  })
})

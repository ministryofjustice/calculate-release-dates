import dayjs from 'dayjs'
import CalculationSummaryPage from '../pages/calculationSummary'
import ErrorPage from '../pages/error'
import Page from '../pages/page'
import ApprovedDatesQuestionPage from '../pages/approvedDatesQuestion'

context('Calculation summary', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPrisonerDetails')
    cy.task('stubGetCalculationResults')
    cy.task('stubGetCalculationBreakdown')
    cy.task('stubGetNextWorkingDay')
    cy.task('stubGetPreviousWorkingDay')
    cy.task('stubGetUserCaseloads')
    cy.task('stubConfirmCalculation_errorNomisDataChanged')
    cy.task('stubConfirmCalculation_errorServerError')
    cy.task('stubSentencesAndOffences')
    cy.task('stubComponents')
    cy.task('stubGetDetailedCalculationResults')
  })

  it('Visit Calculation summary page', () => {
    cy.signIn()
    const calculationSummaryPage = CalculationSummaryPage.goTo('A1234AB', '123')
    calculationSummaryPage.submitToNomisButton().should('exist')
    calculationSummaryPage.sledDate().should('contain.text', 'Monday, 05 November 2018')
    calculationSummaryPage.crdDate().should('contain.text', dayjs().add(7, 'day').format('dddd, DD MMMM YYYY'))
    calculationSummaryPage.crdHints(0).should('contain.text', 'Friday, 05 May 2017 when adjusted to a working day')
    calculationSummaryPage.hdcedDate().should('contain.text', dayjs().add(3, 'day').format('dddd, DD MMMM YYYY'))
    calculationSummaryPage
      .hdcedWeekendHint(0)
      .should('contain.text', 'Wednesday, 28 December 2016 when adjusted to a working day')

    calculationSummaryPage.concurrentSentenceTable().should('contain.text', 'Court case 2, count 2')
    calculationSummaryPage.concurrentSentenceTable().should('contain.text', 'Court case number: ABC123')
    calculationSummaryPage.concurrentSentenceTable().should('contain.text', '16 July 2021')
    calculationSummaryPage.concurrentSentenceTable().should('contain.text', '365 days')
    calculationSummaryPage.concurrentSentenceTable().should('contain.text', '15 January 2021')
    calculationSummaryPage.concurrentSentenceTable().should('contain.text', '183 days')
    calculationSummaryPage.concurrentSentenceTable().should('contain.text', 'Court case 4, count 4')
    calculationSummaryPage.concurrentSentenceTable().should('contain.text', 'Court case number: ABC234')
    calculationSummaryPage.concurrentSentenceTable().should('contain.text', '12 February 2021')
    calculationSummaryPage.concurrentSentenceTable().should('contain.text', '62 days')
    calculationSummaryPage.concurrentSentenceTable().should('contain.text', '12 January 2021')
    calculationSummaryPage.concurrentSentenceTable().should('contain.text', '31 days')

    calculationSummaryPage.consecutiveStartDate().should('contain.text', '20 March 2020')

    calculationSummaryPage.consecutiveSentenceTable().should('contain.text', 'Court case 1, count 1')
    calculationSummaryPage.consecutiveSentenceTable().should('contain.text', 'Court case number: ABC345')
    calculationSummaryPage.consecutiveSentenceTable().should('contain.text', 'Court case 3, count 3')
    calculationSummaryPage.consecutiveSentenceTable().should('contain.text', 'Court case number: ABC567')
    calculationSummaryPage.consecutiveSentenceTable().should('contain.text', 'consecutive to court case 1, count 1')
    calculationSummaryPage.consecutiveSentenceTable().should('contain.text', 'Court case 5, count 5')
    calculationSummaryPage.consecutiveSentenceTable().should('contain.text', 'Court case number: ABC678')
    calculationSummaryPage.consecutiveSentenceTable().should('contain.text', 'consecutive to court case 3, count 3')

    calculationSummaryPage.consecutiveDatesTable().should('contain.text', '2071 days')
    calculationSummaryPage.consecutiveDatesTable().should('contain.text', '20 November 2018')
    calculationSummaryPage.consecutiveDatesTable().should('contain.text', '13 May 2017')

    calculationSummaryPage.releaseDatesAdjustmentsTable().should('contain.text', '20 November 2018 minus 15 days')
    calculationSummaryPage.releaseDatesAdjustmentsTable().should('contain.text', '13 May 2017 minus 6 days')
  })

  it('Error when NOMIS data has changed', () => {
    cy.signIn()
    const approvedDatesQuestionPage = ApprovedDatesQuestionPage.goTo('A1234AB', '98')
    approvedDatesQuestionPage.no().click()
    approvedDatesQuestionPage.continue().click()
    const redirectedView = CalculationSummaryPage.verifyOnPage(CalculationSummaryPage)
    redirectedView
      .errorSummary()
      .should(
        'contain.text',
        'The booking data that was used for this calculation has changed, go back to the Check NOMIS Information screen to see the changes',
      )
    redirectedView.errorSummary().find('a').should('have.attr', 'href', '/calculation/A1234AB/check-information')
  })
  it('Error when server error', () => {
    cy.signIn()
    const approvedDatesQuestionPage = ApprovedDatesQuestionPage.goTo('A1234AB', '99')
    approvedDatesQuestionPage.no().click()
    approvedDatesQuestionPage.continue().click()
    const redirectedView = CalculationSummaryPage.verifyOnPage(CalculationSummaryPage)
    redirectedView.errorSummary().should('contain.text', 'The calculation could not be saved in NOMIS.')
  })

  it('Error when calc id doesnt match prisoner id', () => {
    cy.signIn()
    CalculationSummaryPage.visit('NOT_MATCHING', '97', false)
    const errorPage = Page.verifyOnPage(ErrorPage)
    errorPage.heading().contains('There is a problem')
  })

  it('Calculation summary page is accessible', () => {
    cy.signIn()
    CalculationSummaryPage.goTo('A1234AB', '123')
    cy.injectAxe()
    cy.checkA11y()
  })
})

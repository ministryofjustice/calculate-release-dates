import dayjs from 'dayjs'
import CalculationSummaryPage from '../pages/calculationSummary'
import ErrorPage from '../pages/error'
import Page from '../pages/page'
import ApprovedDatesQuestionPage from '../pages/approvedDatesQuestion'
import { AllocatedTranches } from '../../server/@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

context('Calculation summary', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPrisonerDetails')
    cy.task('stubGetCalculationResults')
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
    cy.signIn({ failOnStatusCode: false, returnUrl: '/prisonId=A1234AB' })
    const calculationSummaryPage = CalculationSummaryPage.goTo('A1234AB', '123')
    calculationSummaryPage.continueButton().should('exist')
    calculationSummaryPage.sledDate().should('contain.text', 'Monday, 05 November 2018')
    calculationSummaryPage.crdDate().should('contain.text', dayjs().add(7, 'day').format('dddd, DD MMMM YYYY'))
    calculationSummaryPage.crdHints(0).should('contain.text', 'Friday, 05 May 2017 when adjusted to a working day')
    calculationSummaryPage.hdcedDate().should('contain.text', dayjs().add(3, 'day').format('dddd, DD MMMM YYYY'))
    calculationSummaryPage
      .hdcedWeekendHint(0)
      .should('contain.text', 'Wednesday, 28 December 2016 when adjusted to a working day')
    calculationSummaryPage.crdDateShouldNotNotBePresent('CRD')
  })

  it('Visit Calculation summary page with FTR56 Tranche notification', () => {
    cy.task('stubGetDetailedCalculationResults', {
      previouslyRecordedSLED: null,
      ftr56Tranche: 'FTR_56_TRANCHE_3',
    })
    cy.signIn({ failOnStatusCode: false, returnUrl: '/?prisonId=A1234AB' })
    const calculationSummaryPage = CalculationSummaryPage.goTo('A1234AB', '123')
    calculationSummaryPage
      .frt56TrancheNotification()
      .should('contain.text', 'This person is in Tranche 3 of the fixed-term recalls legislation change.')
  })

  it('Visit Calculation summary page with Progression Tranche notification', () => {
    const tranches: AllocatedTranches[] = [
      { legislationName: 'SDS_PROGRESSION_MODEL', trancheName: 'TRANCHE_3', trancheDate: '2024-12-01' },
    ]
    cy.task('stubGetDetailedCalculationResults', {
      previouslyRecordedSLED: null,
      progressionModelTranche: 'TRANCHE_3',
      allocatedTranches: tranches,
    })
    cy.signIn({ failOnStatusCode: false, returnUrl: '/?prisonId=A1234AB' })
    const calculationSummaryPage = CalculationSummaryPage.goTo('A1234AB', '123')
    calculationSummaryPage
      .progressionTrancheNotification()
      .should(
        'contain.text',
        'This person is in Tranche 3 of the Progression Model legislation change, commencing Sunday, 1 December 2024',
      )
  })

  it('Visit Calculation summary page with no Progression Tranche notification if allocated Tranche 0', () => {
    const tranches: AllocatedTranches[] = [
      { legislationName: 'SDS_PROGRESSION_MODEL', trancheName: 'TRANCHE_0', trancheDate: null },
    ]
    cy.task('stubGetDetailedCalculationResults', {
      previouslyRecordedSLED: null,
      progressionModelTranche: 'TRANCHE_0',
      allocatedTranches: tranches,
    })
    cy.signIn({ failOnStatusCode: false, returnUrl: '/?prisonId=A1234AB' })
    const calculationSummaryPage = CalculationSummaryPage.goTo('A1234AB', '123')
    calculationSummaryPage.progressionTrancheNotification().should('not.exist')
  })

  it('Error when NOMIS data has changed', () => {
    cy.signIn({ failOnStatusCode: false, returnUrl: '/prisonId=A1234AB' })
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
    cy.signIn({ failOnStatusCode: false, returnUrl: '/prisonId=A1234AB' })
    const approvedDatesQuestionPage = ApprovedDatesQuestionPage.goTo('A1234AB', '99')
    approvedDatesQuestionPage.no().click()
    approvedDatesQuestionPage.continue().click()
    const redirectedView = CalculationSummaryPage.verifyOnPage(CalculationSummaryPage)
    redirectedView.errorSummary().should('contain.text', 'The calculation could not be saved in NOMIS.')
  })

  it('Error when calc id doesnt match prisoner id', () => {
    cy.signIn({ failOnStatusCode: false, returnUrl: '/prisonId=A1234AB' })
    CalculationSummaryPage.visit('NOT_MATCHING', '97', false)
    const errorPage = Page.verifyOnPage(ErrorPage)
    errorPage.heading().contains('The details for this person cannot be found')
  })

  it('Calculation summary page is accessible', () => {
    cy.signIn({ failOnStatusCode: false, returnUrl: '/prisonId=A1234AB' })
    CalculationSummaryPage.goTo('A1234AB', '123')
    cy.injectAxe()
    cy.checkA11y()
  })
})

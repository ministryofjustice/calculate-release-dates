import { verify } from 'crypto'
import IndexPage from '../pages'
import CalculationCompletePage from '../pages/calculationComplete'
import CalculationSummaryPage from '../pages/calculationSummary'
import CheckInformationPage from '../pages/checkInformation'
import Page from '../pages/page'
import PrisonerSearchPage from '../pages/prisonerSearch'
import ViewCalculationSummary from '../pages/viewCalculationSummary'
import ViewSentencesAndOffencesPage from '../pages/viewSentencesAndOffences'

context('View journey tests', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubPrisonerSearch')
    cy.task('stubGetUserCaseloads')
    cy.task('stubGetPrisonerDetails')
  })

  it('View journey', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.viewJourneyLink().click()

    const prisonerSearchPage = Page.verifyOnPage(PrisonerSearchPage)
    prisonerSearchPage.searchForFirstName('Marvin')
    prisonerSearchPage.prisonerLinkFor('A1234AB').click()
    cy.get('.govuk-heading-xl').contains('No calculation submitted')
  })
})

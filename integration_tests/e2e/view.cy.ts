import Page from '../pages/page'
import PrisonerOverviewPage from '../pages/PrisonerOverviewPage'
import CalculationHistoryOverviewPage from '../pages/calculationHistoryOverviewPage'
import PrintNotificationSlipPage from '../pages/printNotificationSlipPage'
import {
  HistoricCalculationSummary,
  HistoricCalculationSummaryPage,
} from '../../server/@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

context('View journey tests', () => {
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
    cy.task('stubConfirmCalculation')
    cy.task('stubGetNextWorkingDay')
    cy.task('stubGetPreviousWorkingDay')
    cy.task('stubValidate')
    cy.task('stubAdjustments')
    cy.task('stubGetAnalyzedSentenceAdjustments')
    cy.task('stubGetAdjustmentsForPrisoner')
    cy.task('stubSentencesAndOffences')
    cy.task('stubPrisonerDetails')
    cy.task('stubCalculationUserInputs')
    cy.task('stubGetActiveCalculationReasons')
    cy.task('stubGetCalculationHistory')
    cy.task('stubGetDetailedCalculationResults')
    cy.task('stubComponents')
    cy.task('stubGetLatestCalculation')
    cy.task('stubGetPrisonerCalculationOverview')
    cy.task('stubGetReferenceDates')
    cy.task('stubHasNoIndeterminateSentences')
    cy.task('stubGetServiceDefinitions')
    cy.task('stubGetEligibility')
    cy.task('stubConfirmSecondCheck')
  })

  it('View journey for prisoner without calculation submitted', () => {
    cy.task('stubGetPrisonerCalculationOverviewNone')
    cy.signIn({ failOnStatusCode: false, returnUrl: '/A1234AB/overview' })

    PrisonerOverviewPage.goTo('A1234AB')

    const landingPage = Page.verifyOnPage(PrisonerOverviewPage)
    landingPage.hasMiniProfile()
    landingPage.calculateReleaseDatesAction().should('exist')
  })

  it('View journey navigate to calculation history from latest calculation and then print notification slip', () => {
    cy.task('stubGetPrisonerCalculationOverview')
    cy.task('stubGetReleaseDates')
    cy.task('stubAdjustmentsUsingAdjustmentsApi')
    const page: HistoricCalculationSummaryPage = {
      items: [
        {
          calculationDate: '2024-03-05T10:30:00',
          calculationSource: 'CRDS',
          crdsCalculationId: 123,
          reasonDescription: 'Transfer',
          calculatedByDisplayName: 'User One',
        },
      ],
      page: {
        pageNumber: 1,
        totalPages: 1,
        totalItems: 1,
      },
    }
    cy.task('stubGetCalculationHistoryPage', page)
    cy.signIn({ failOnStatusCode: false, returnUrl: '/A1234AB/overview' })

    PrisonerOverviewPage.goTo('A1234AB')
    Page.verifyOnPage(PrisonerOverviewPage).navigateToCalculationDetailsLink().click()

    Page.verifyOnPage(CalculationHistoryOverviewPage).clickPrintNotificationSlip()

    Page.verifyOnPage(PrintNotificationSlipPage)
  })

  it('Can navigate pages of history', () => {
    cy.task('stubGetPrisonerCalculationOverview')
    const pageOneItems = [30, 29, 28, 27, 26, 25, 24, 23, 22, 21].map(idx => {
      return {
        calculationDate: `2026-01-${idx}`,
        calculationSource: 'CRDS',
        crdsCalculationId: 123,
        reasonDescription: 'Transfer',
        calculatedByDisplayName: 'User One',
      } as HistoricCalculationSummary
    })
    const pageOne: HistoricCalculationSummaryPage = {
      items: pageOneItems,
      page: {
        pageNumber: 1,
        totalPages: 3,
        totalItems: 30,
      },
    }
    const pageTwoItems = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11].map(idx => {
      return {
        calculationDate: `2026-01-${idx}`,
        calculationSource: 'CRDS',
        crdsCalculationId: 123,
        reasonDescription: 'Transfer',
        calculatedByDisplayName: 'User One',
      } as HistoricCalculationSummary
    })
    const pageTwo: HistoricCalculationSummaryPage = {
      items: pageTwoItems,
      page: {
        pageNumber: 2,
        totalPages: 3,
        totalItems: 30,
      },
    }
    const pageThreeItems = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(idx => {
      return {
        calculationDate: `2026-01-${idx}`,
        calculationSource: 'CRDS',
        crdsCalculationId: 123,
        reasonDescription: 'Transfer',
        calculatedByDisplayName: 'User One',
      } as HistoricCalculationSummary
    })
    const pageThree: HistoricCalculationSummaryPage = {
      items: pageThreeItems,
      page: {
        pageNumber: 3,
        totalPages: 3,
        totalItems: 30,
      },
    }
    cy.task('stubGetCalculationHistoryPage', pageOne)
    cy.task('stubGetCalculationHistoryPage', pageTwo)
    cy.task('stubGetCalculationHistoryPage', pageThree)
    cy.signIn({ failOnStatusCode: false, returnUrl: '/A1234AB/overview' })

    PrisonerOverviewPage.goTo('A1234AB')
    Page.verifyOnPage(PrisonerOverviewPage).navigateToCalculationDetailsLink().click()

    Page.verifyOnPage(CalculationHistoryOverviewPage)
      .shouldBeShowingItems('1 to 10 of 30')
      .clickOlderCalculations()
      .shouldBeShowingItems('11 to 20 of 30')
      .clickOlderCalculations()
      .shouldBeShowingItems('21 to 30 of 30')
      .clickNewerCalculations()
      .shouldBeShowingItems('11 to 20 of 30')
      .clickNewerCalculations()
      .shouldBeShowingItems('1 to 10 of 30')
      .clickBack()

    Page.verifyOnPage(PrisonerOverviewPage).navigateToCalculationDetailsLink()
  })
})

import Page from '../pages/page'
import PrisonerSearchPage from '../pages/prisonerSearch'
import CCARDLandingPage from '../pages/CCARDLandingPage'

context('View journey tests', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubPrisonerSearch')
    cy.task('stubGetUserCaseloads')
    cy.task('stubGetPrisonerDetails')
    cy.task('stubCalculationUserInputs')
    cy.task('stubComponents')
    cy.task('stubGetCalculationHistoryNone')
    cy.task('stubHasNoIndeterminateSentences')
    cy.task('stubGetServiceDefinitions')
  })

  it('View journey search for prisoner without calculation submitted', () => {
    cy.task('stubGetLatestCalculationNone')
    cy.signIn()

    const prisonerSearchPage = Page.verifyOnPage(PrisonerSearchPage)
    prisonerSearchPage.searchForFirstName('Marvin')
    prisonerSearchPage.prisonerLinkFor('A1234AB').click()

    const ccardLandingPage = Page.verifyOnPage(CCARDLandingPage)
    ccardLandingPage.hasMiniProfile()
    ccardLandingPage.calculateReleaseDatesAction().should('exist')
    ccardLandingPage.hasMissingOffenceDates(false)
    ccardLandingPage.hasMissingOffenceTerms(false)
    ccardLandingPage.hasMissingOffenceLicenceTerms(false)
  })

  it('View journey search show no offence dates warning', () => {
    cy.task('stubGetLatestCalculationNoOffenceDates')
    cy.signIn()

    const prisonerSearchPage = Page.verifyOnPage(PrisonerSearchPage)
    prisonerSearchPage.searchForFirstName('Marvin')
    prisonerSearchPage.prisonerLinkFor('A1234AB').click()

    const ccardLandingPage = Page.verifyOnPage(CCARDLandingPage)
    ccardLandingPage.hasMiniProfile()
    ccardLandingPage.hasMissingOffenceDates(true)
  })

  it('View journey search show no offence terms', () => {
    cy.task('stubGetLatestCalculationNoOffenceTerms')
    cy.signIn()

    const prisonerSearchPage = Page.verifyOnPage(PrisonerSearchPage)
    prisonerSearchPage.searchForFirstName('Marvin')
    prisonerSearchPage.prisonerLinkFor('A1234AB').click()

    const ccardLandingPage = Page.verifyOnPage(CCARDLandingPage)
    ccardLandingPage.hasMiniProfile()
    ccardLandingPage.hasMissingOffenceTerms(true)
  })

  it('View journey search show no offence licence terms', () => {
    cy.task('stubGetLatestCalculationNoOffenceLicenceTerms')
    cy.signIn()

    const prisonerSearchPage = Page.verifyOnPage(PrisonerSearchPage)
    prisonerSearchPage.searchForFirstName('Marvin')
    prisonerSearchPage.prisonerLinkFor('A1234AB').click()

    const ccardLandingPage = Page.verifyOnPage(CCARDLandingPage)
    ccardLandingPage.hasMiniProfile()
    ccardLandingPage.hasMissingOffenceLicenceTerms(true)
  })
})

import CheckInformationPage from '../pages/checkInformation'

context('Check nomis information', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubGetPrisonerDetails')
    cy.task('stubGetSentencesAndOffences')
    cy.task('stubGetSentenceAdjustments')
    cy.task('stubGetUserCaseloads')
  })

  it('Visit check nomis information page', () => {
    cy.signIn()
    const checkInformationPage = CheckInformationPage.goTo('A1234AB')
    checkInformationPage
      .offenceCountText()
      .should('contains.text', 'There are 3 offences included in this calculation.')
  })

  it('Check nomis information page is accessible', () => {
    cy.signIn()
    CheckInformationPage.goTo('A1234AB')
    cy.injectAxe()
    cy.checkA11y(null, {
      includedImpacts: ['critical', 'serious'],
    })
  })
})

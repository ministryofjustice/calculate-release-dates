import CheckInformationPage from '../pages/checkInformation'

context('Check nomis information', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubGetPrisonerDetails')
    cy.task('stubGetSentencesAndOffences')
    cy.task('stubGetSentenceAdjustments')
  })

  it('Visit check nomis information page', () => {
    cy.signIn()
    const checkInformationPage = CheckInformationPage.goTo('A1234AB')
    checkInformationPage.checkUrl('A1234AB')
    checkInformationPage.checkOffenceCountText('There are 3 offences included in this calculation.')
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

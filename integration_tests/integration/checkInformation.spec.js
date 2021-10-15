const CheckInformationPage = require('../pages/checkInformation')

context('Check nomis information', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubAuthUser')
    cy.task('stubGetPrisonerDetails')
    cy.task('stubGetSentencesAndOffences')
    cy.task('stubGetSentenceAdjustments')
  })

  it('Visit check nomis information page', () => {
    cy.login()
    const checkInformationPage = CheckInformationPage.goTo('A1234AB')
    checkInformationPage.checkUrl('A1234AB')
    checkInformationPage.checkOffenceCountText('There are 3 offences included in this calculation.')
    cy.injectAxe()
    cy.checkA11y(null, {
      includedImpacts: ['critical', 'serious'],
    })
  })
})

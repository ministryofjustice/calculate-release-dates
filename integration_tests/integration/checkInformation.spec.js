const IndexPage = require('../pages/index')
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
    cy.url().should('match', new RegExp('/calculation/A1234AB/check-information'))
    // const landingPage = IndexPage.verifyOnPage()
    // landingPage.headerUserName().should('contain.text', 'J. Smith')
    // landingPage.mainHeading().should('contain.text', 'Calculate release dates')
    // landingPage.startNowButton().click()
    // cy.url().should('match', new RegExp(`.+/search/prisoners$`))
  })
})

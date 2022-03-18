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
    checkInformationPage.offenceCountText().contains('This calculation will include 2 sentences from NOMIS.') // contain.text didn't like the whitespace

    checkInformationPage.sentenceTable(1).should('contain.text', 'Committed on 03 February 2021')
    checkInformationPage.sentenceTable(1).contains('3 years') // contain.text didn't like the whitespace

    checkInformationPage.sentenceTable(2).should('contain.text', 'Committed on 05 February 2021')
    checkInformationPage.sentenceTable(2).contains('2 years')
    checkInformationPage.sentenceTable(2).contains('consecutive to court case 1 count 1')

    checkInformationPage.adjustmentSummary().should('contain.text', 'Remand')
    checkInformationPage.adjustmentSummary().should('contain.text', '28')

    checkInformationPage.adjustmentDetailedTabLink().click()
    checkInformationPage.adjustmentDetailed().should('contain.text', 'From 03 February 2021 to 08 March 2021')
  })

  it('Check nomis information page is accessible', () => {
    cy.signIn()
    CheckInformationPage.goTo('A1234AB')
    cy.injectAxe()
    cy.checkA11y()
  })
})

import CheckInformationPage from '../pages/checkInformation'
import CalculationReasonPage from '../pages/reasonForCalculation'

context('Check nomis information', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPrisonerDetails')
    cy.task('stubGetSentencesAndOffences')
    cy.task('stubGetActiveCalculationReasons')
    cy.task('stubGetAnalyzedSentencesAndOffences')
    cy.task('stubGetAnalyzedSentenceAdjustments')
    cy.task('stubGetAdjustmentsForPrisoner')
    cy.task('stubGetUserCaseloads')
    cy.task('stubSupportedValidationNoMessages')
    cy.task('stubComponents')
    cy.task('stubGetServiceDefinitions')
    cy.task('stubGetEligibility')
  })

  it('Visit check nomis information page', () => {
    cy.signIn({ failOnStatusCode: false, returnUrl: '/?prisonId=A1234AB' })

    CalculationReasonPage.goTo('A1234AB')
    const calculationReasonPage = CalculationReasonPage.verifyOnPage(CalculationReasonPage)
    calculationReasonPage.radioByIndex(1).check()
    calculationReasonPage.hasMiniProfile()
    calculationReasonPage.submitReason().click()

    const checkInformationPage = CheckInformationPage.verifyOnPage(CheckInformationPage)
    checkInformationPage.offenceCountText().contains('This calculation will include 2 sentences from NOMIS.') // contain.text didn't like the whitespace

    checkInformationPage.sentenceCards(1).should('contain.text', 'Committed on 03 February 2021')
    checkInformationPage.sentenceCards(1).contains('3 years') // contain.text didn't like the whitespace
    checkInformationPage.caseNumber(1).contains('ABC123')

    checkInformationPage.sentenceCards(2).should('contain.text', 'Committed on 05 February 2021')
    checkInformationPage.sentenceCards(2).contains('2 years')
    checkInformationPage.sentenceCards(2).contains('Consecutive to court case 1 NOMIS line number 1')

    checkInformationPage.caseNumber(2).contains('ABC234')

    checkInformationPage.remandTable().should('contain.text', 'Remand')
    checkInformationPage.remandTable().should('contain.text', '28')

    calculationReasonPage.hasMissingOffenceDates(false)
    calculationReasonPage.hasMissingOffenceTerms(false)
    calculationReasonPage.hasMissingOffenceLicenceTerms(false)
  })

  it('Check nomis information page is accessible', () => {
    cy.signIn({ failOnStatusCode: false, returnUrl: '/?prisonId=A1234AB' })
    CalculationReasonPage.goTo('A1234AB')
    const calculationReasonPage = CalculationReasonPage.verifyOnPage(CalculationReasonPage)
    calculationReasonPage.radioByIndex(1).check()
    calculationReasonPage.hasMiniProfile()
    calculationReasonPage.submitReason().click()

    CheckInformationPage.verifyOnPage(CheckInformationPage)
    cy.injectAxe()
    cy.checkA11y()
  })

  it('Check nomis information page displays missing offence dates if missing within Nomis', () => {
    cy.task('stubSupportedValidationNoOffenceDates')
    cy.signIn({ failOnStatusCode: false, returnUrl: '/prisonId=A1234AB' })
    CalculationReasonPage.goTo('A1234AB')
    const calculationReasonPage = CalculationReasonPage.verifyOnPage(CalculationReasonPage)
    calculationReasonPage.radioByIndex(1).check()
    calculationReasonPage.hasMiniProfile()
    calculationReasonPage.submitReason().click()
    calculationReasonPage.hasMissingOffenceDates(true)
  })

  it('Check nomis information page displays missing offence terms if missing within Nomis', () => {
    cy.task('stubSupportedValidationNoOffenceTerms')
    cy.signIn({ failOnStatusCode: false, returnUrl: '/prisonId=A1234AB' })
    CalculationReasonPage.goTo('A1234AB')
    const calculationReasonPage = CalculationReasonPage.verifyOnPage(CalculationReasonPage)
    calculationReasonPage.radioByIndex(1).check()
    calculationReasonPage.hasMiniProfile()
    calculationReasonPage.submitReason().click()
    calculationReasonPage.hasMissingOffenceTerms(true)
  })

  it('Check nomis information page displays missing offence licence terms if missing within Nomis', () => {
    cy.task('stubSupportedValidationNoOffenceLicenceTerms')
    cy.signIn({ failOnStatusCode: false, returnUrl: '/prisonId=A1234AB' })
    CalculationReasonPage.goTo('A1234AB')
    const calculationReasonPage = CalculationReasonPage.verifyOnPage(CalculationReasonPage)
    calculationReasonPage.radioByIndex(1).check()
    calculationReasonPage.hasMiniProfile()
    calculationReasonPage.submitReason().click()
    calculationReasonPage.hasMissingOffenceLicenceTerms(true)
  })
})

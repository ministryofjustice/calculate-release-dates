import CalculationQuestionPage from '../pages/calculationQuestions'

context('Calculation questions page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubGetPrisonerDetails')
    cy.task('stubGetSentencesAndOffences')
    cy.task('stubGetUserCaseloads')
    cy.task('stubCalculationQuestions')
  })

  it('Visit calculation question page and test functionality', () => {
    cy.signIn()
    const calculationQuestionPage = CalculationQuestionPage.goTo('A1234AB')

    calculationQuestionPage.selectAllCheckbox().should('not.be.checked')
    calculationQuestionPage.checkboxByIndex(0).should('not.be.checked')
    calculationQuestionPage.checkboxByIndex(1).should('not.be.checked')

    calculationQuestionPage.selectAllCheckbox().click()
    calculationQuestionPage.selectAllCheckbox().should('be.checked')
    calculationQuestionPage.checkboxByIndex(0).should('be.checked')
    calculationQuestionPage.checkboxByIndex(1).should('be.checked')

    calculationQuestionPage.checkboxByIndex(1).click()
    calculationQuestionPage.selectAllCheckbox().should('not.be.checked')
    calculationQuestionPage.checkboxByIndex(0).should('be.checked')
    calculationQuestionPage.checkboxByIndex(1).should('not.be.checked')

    calculationQuestionPage.checkboxByIndex(1).click()
    calculationQuestionPage.selectAllCheckbox().should('be.checked')
    calculationQuestionPage.checkboxByIndex(0).should('be.checked')
    calculationQuestionPage.checkboxByIndex(1).should('be.checked')

    calculationQuestionPage.continueButton().click()

    const reloadedPage = CalculationQuestionPage.goTo('A1234AB')
    reloadedPage.selectAllCheckbox().should('be.checked')
    reloadedPage.checkboxByIndex(0).should('be.checked')
    reloadedPage.checkboxByIndex(1).should('be.checked')
  })

  it('Calculation question page is accessible', () => {
    cy.signIn()
    CalculationQuestionPage.goTo('A1234AB')
    cy.injectAxe()
    cy.checkA11y()
  })
})

import AlternativeReleaseIntroPage from '../pages/alternativeReleaseIntro'
import CheckInformationPage from '../pages/checkInformation'
import SelectOffencesPage from '../pages/selectOffences'

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

  it('Visit alternative release intro page and test functionality', () => {
    cy.signIn()
    const alternativeReleaseIntro = AlternativeReleaseIntroPage.goTo('A1234AB')

    alternativeReleaseIntro.listA().should('exist')
    alternativeReleaseIntro.listB().should('not.exist')
    alternativeReleaseIntro.listC().should('exist')
    alternativeReleaseIntro.listD().should('not.exist')

    alternativeReleaseIntro.continueButton().click()

    const listAPage = SelectOffencesPage.verifyOnPage<SelectOffencesPage>(SelectOffencesPage, 'list-a')
    listAPage.offenceListLink().should('have.attr', 'href').should('not.be.empty').and('equals', '/list-a')
    listAPage.checkboxByIndex(0).click()
    listAPage.checkboxByIndex(0).should('be.checked')
    listAPage.continueButton().click()
    const listCPage = SelectOffencesPage.verifyOnPage<SelectOffencesPage>(SelectOffencesPage, 'list-c')
    listCPage.offenceListLink().should('have.attr', 'href').should('not.be.empty').and('equals', '/list-c')
    listCPage.backLink().click()
    const listAPageRevisited = SelectOffencesPage.verifyOnPage<SelectOffencesPage>(SelectOffencesPage, 'list-a')
    listAPageRevisited.checkboxByIndex(0).should('be.checked')
    listAPageRevisited.continueButton().click()
    const listCPageRevisited = SelectOffencesPage.verifyOnPage<SelectOffencesPage>(SelectOffencesPage, 'list-c')
    listCPageRevisited.checkboxByIndex(0).should('not.be.checked')
  })

  it('Alternative release intro page page is accessible', () => {
    cy.signIn()
    AlternativeReleaseIntroPage.goTo('A1234AB')
    cy.injectAxe()
    cy.checkA11y()
  })
})

import Page, { PageElement } from './page'

export default class ManualDatesConfirmationPage extends Page {
  constructor() {
    super('manual-dates-confirmation')
  }

  public dateShouldHaveValue(type: string, expected: string) {
    cy.get(`.manual-entry-value-for-${type}`).should('contain.text', expected)
  }

  public dateShouldNotBePresent(type: string) {
    cy.get(`.manual-entry-value-for-${type}`).should('not.exist')
  }

  public expressJourneyChangedDatesConfirmationExists() {
    cy.get('#main-content').should('contain.text', 'Confirm if the dates are still correct')
  }

  public expressJourneyConfirmNoChanges() {
    cy.get('#confirm-dates').click()
  }

  public expressJourneyConfirmChanges() {
    cy.get('#confirm-dates-2').click()
  }

  public expressJourneyConfirmChoice() {
    cy.get('[data-qa=calculated-dates-confirm]').click()
  }

  public expressJourneyHasImmutableDates(flag: boolean) {
    cy.get('.govuk-summary-list__actions', { timeout: 0 }).should(flag ? 'exist' : 'not.exist')
  }

  public expressJourneyShowsPaperCalculationTitle() {
    cy.get('#main-content').should('contain.text', ' Enter the dates from your paper calculation')
  }

  public addAnotherReleaseDateLink = (): PageElement => cy.get(`[data-qa=add-another-release-date-link]`)

  public editReleaseDateLink = (type: string): PageElement => cy.get(`[data-qa=change-manual-date-${type}]`)

  public removeReleaseDateLink = (type: string): PageElement => cy.get(`[data-qa=remove-manual-date-${type}]`)

  public submitToNomisButton = (): PageElement => cy.get('[data-qa=submit-to-nomis]')

  public addAnotherDatesLink = (): PageElement => cy.get('[data-qa=add-another-release-date-link]')
}

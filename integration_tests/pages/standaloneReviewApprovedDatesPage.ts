import Page, { PageElement } from './page'

export default class StandaloneReviewApprovedDatesPage extends Page {
  constructor() {
    super('review-approved-dates')
  }

  public expectDates(expected: string[]): StandaloneReviewApprovedDatesPage {
    cy.get('.govuk-summary-list__key').spread((...$lis) => {
      expect($lis).to.have.lengthOf(expected.length)
      expected.forEach((val, index) => {
        expect($lis[index]).to.contain(val)
      })
    })
    return this
  }

  public expectDate(type: string, date: string): StandaloneReviewApprovedDatesPage {
    cy.get(`.${type}-date-value`).should('contain.text', date)
    return this
  }

  public addDatesLink(): PageElement {
    return cy.get('[data-qa=add-dates-link]')
  }

  public editDateLink(type: string): PageElement {
    return cy.get(`[data-qa=edit-${type}-link]`)
  }

  public deleteDateLink(type: string): PageElement {
    return cy.get(`[data-qa=delete-${type}-link]`)
  }

  public continueButton(): PageElement {
    return cy.get('[data-qa=confirm-and-save]')
  }

  public cancel(): PageElement {
    return cy.get('[data-qa=cancel-link]')
  }

  public clickBack(): StandaloneReviewApprovedDatesPage {
    cy.get('.govuk-back-link').click()
    return this
  }
}

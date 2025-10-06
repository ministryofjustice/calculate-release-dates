import Page, { PageElement } from './page'

export default class GenuineOverrideReviewDatesPage extends Page {
  constructor() {
    super('genuine-override-review-dates')
  }

  public expectDates(expected: string[]): GenuineOverrideReviewDatesPage {
    cy.get('.govuk-summary-list__key').spread((...$lis) => {
      expect($lis).to.have.lengthOf(expected.length)
      expected.forEach((val, index) => {
        expect($lis[index]).to.contain(val)
      })
    })
    return this
  }

  public expectDate(type: string, date: string): GenuineOverrideReviewDatesPage {
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
}

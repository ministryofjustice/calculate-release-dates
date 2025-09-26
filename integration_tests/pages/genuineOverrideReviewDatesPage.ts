import Page, { PageElement } from './page'

export default class GenuineOverrideReviewDatesPage extends Page {
  constructor() {
    super('genuine-override-review-dates')
  }

  public expectDates(expected: string[]) {
    cy.get('.govuk-summary-list__key').spread((...$lis) => {
      expect($lis).to.have.lengthOf(expected.length)
      expected.forEach((val, index) => {
        expect($lis[index]).to.contain(val)
      })
    })
  }

  public expectDate(type: string, date: string) {
    cy.get(`.${type}-date-value`).should('contain.text', date)
  }

  public addDatesLink(): PageElement {
    return cy.get('[data-qa=add-dates-link]')
  }

  public continueButton(): PageElement {
    return cy.get('[data-qa=confirm-and-save]')
  }

  public cancel(): PageElement {
    return cy.get('[data-qa=cancel-link]')
  }
}

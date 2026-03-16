import Page, { PageElement } from './page'

export default class CalculationReasonPage extends Page {
  constructor() {
    super(`reason`)
  }

  public static goTo(prisonerId: string): CalculationReasonPage {
    cy.visit(`/calculation/${prisonerId}/reason`)
    return new CalculationReasonPage()
  }

  public radioByReasonId(reasonId: number): PageElement {
    return cy.get(`[data-qa=reasonRadio-${reasonId}]`)
  }

  public furtherDetailByReasonId(reasonId: number): PageElement {
    return cy.get(`#reason-further-detail-${reasonId}`)
  }

  public submitReason(): PageElement {
    return cy.get(`[data-qa=submitReason]`)
  }

  headerUserName(): PageElement {
    return cy.get('[data-qa=header-user-name]')
  }

  hasMissingOffenceDates(flag: boolean) {
    const check = flag ? 'exist' : 'not.exist'
    cy.get('p')
      .contains('This service cannot calculate release dates because the offence start date is missing.')
      .should(check)
  }

  hasMissingOffenceTerms(flag: boolean) {
    const check = flag ? 'exist' : 'not.exist'
    cy.get('p')
      .contains('This service cannot calculate release dates because the offence is missing imprisonment terms.')
      .should(check)
  }

  hasMissingOffenceLicenceTerms(flag: boolean) {
    const check = flag ? 'exist' : 'not.exist'
    cy.get('p')
      .contains('This service cannot calculate release dates because the offence is missing a licence code.')
      .should(check)
  }
}

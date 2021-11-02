import Page from './page'

export default class CheckInformationPage extends Page {
  constructor(prisonerName: string) {
    super(`Check NOMIS information about ${prisonerName}`)
  }

  public static goTo(prisonerId: string, prisonerName: string) {
    cy.visit(`/calculation/${prisonerId}/check-information`)
    return new CheckInformationPage(prisonerName)
  }

  public checkOffenceCountText(offenceCountText: string) {
    cy.get('#offence-count-text').should('contains.text', offenceCountText)
  }

  public checkUrl(prisonerId) {
    cy.url().should('match', new RegExp(`/calculation/${prisonerId}/check-information`))
  }
}

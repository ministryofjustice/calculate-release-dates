const checkInformationPage = () => ({
  checkOffenceCountText: offenceCountText => cy.get('#offence-count-text').should('contains.text', offenceCountText),
  checkUrl: prisonerId => cy.url().should('match', new RegExp(`/calculation/${prisonerId}/check-information`)),
})

export default {
  getPage: checkInformationPage,
  goTo: prisonerId => {
    cy.visit(`/calculation/${prisonerId}/check-information`)
    return checkInformationPage()
  },
}

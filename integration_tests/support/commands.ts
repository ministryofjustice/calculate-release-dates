import { getAPICallCountMatching, getLastAPICallMatching } from '../mockApis/wiremock'

Cypress.Commands.add('signIn', (options = { failOnStatusCode: true }) => {
  cy.request('/')
  return cy.task('getSignInUrl').then((url: string) => cy.visit(url, options))
})

Cypress.Commands.add('verifyLastAPICall', (matching: string | object, expected: object) => {
  return cy.wrap(getLastAPICallMatching(matching)).should('eql', expected)
})

Cypress.Commands.add('verifyAPIWasCalled', (matching: string | object, expected: number) => {
  return cy.wrap(getAPICallCountMatching(matching)).should('eq', expected)
})

// ensure .should('eql', thing) displays the full diff
chai.config.truncateThreshold = 0

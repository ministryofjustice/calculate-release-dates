declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to signIn. Set failOnStatusCode to false if you expect and non 200 return code
     * Set returnUrl to specify URL redirect after oauth journey is complete
     * @example cy.signIn({ failOnStatusCode: boolean })
     */
    signIn(options?: { failOnStatusCode: boolean; returnUrl: string }): Chainable<AUTWindow>
    /**
     * Custom command to verify that the last API call matching the parameter is deeply equal to the expected value.
     * @param matching a wiremock request to /requests/find. For options see: https://wiremock.org/docs/standalone/admin-api-reference/#tag/Requests/operation/removeRequestsByMetadata
     * @param expected the request body to match
     */
    verifyLastAPICall(matching: string | object, expected: object): Chainable<*>

    /**
     * Custom command to verify that the last API call matching the parameter is deeply equal to the expected value using chai `.should('have.deep.property', 'x', { a: 1 }).`
     * @param matching a wiremock request to /requests/find. For options see: https://wiremock.org/docs/standalone/admin-api-reference/#tag/Requests/operation/removeRequestsByMetadata
     * @param deepProperty the property to access
     * @param expected the value to match
     */
    verifyLastAPICallDeepProperty(
      matching: string | object,
      deepProperty: string,
      expected: object | string | number | boolean,
    ): Chainable<*>

    /**
     * Custom command to verify that an API matching the parameter was called the expected number of times.
     * @param matching a wiremock request to /requests/find. For options see: https://wiremock.org/docs/standalone/admin-api-reference/#tag/Requests/operation/removeRequestsByMetadata
     * @param expected the number of requests expected
     */
    verifyAPIWasCalled(matching: string | object, expected: number): Chainable<*>
  }
}

import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubGetThingsToDo: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/court-cases-release-dates-api/things-to-do/prisoner/A1234AB(.*)',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          prisonerId: 'A1234AB',
          calculationThingsToDo: [],
          adjustmentThingsToDo: {
            prisonerId: 'A1234AB',
            thingsToDo: [],
            adaIntercept: {},
          },
          hasAdjustmentThingsToDo: false,
          hasCalculationThingsToDo: false,
        },
      },
    })
  },
}

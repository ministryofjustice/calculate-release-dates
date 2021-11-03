import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubPrisonerSearch: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: '/prison-search-api/prisoner-search/match-prisoners',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [
          {
            prisonerNumber: 'A1234AB',
            firstName: 'Marvin',
            lastName: 'Haggler',
            dateOfBirth: '1965-02-03',
          },
        ],
      },
    })
  },
}

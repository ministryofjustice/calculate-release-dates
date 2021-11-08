import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubGetPrisonerDetails: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/prison-api/api/offenders/A1234AB',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          offenderNo: 'A1234AB',
          bookingId: '1234',
          firstName: 'Marvin',
          lastName: 'Haggler',
          dateOfBirth: '1965-02-03',
          agencyId: 'MDI',
        },
      },
    })
  },
  stubGetSentenceAdjustments: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/prison-api/api/bookings/1234/sentenceAdjustments',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          additionalDaysAwarded: 0,
          lawfullyAtLarge: 0,
          recallSentenceRemand: 0,
          recallSentenceTaggedBail: 0,
          remand: 28,
          restoredAdditionalDaysAwarded: 0,
          specialRemission: 0,
          taggedBail: 11,
          unlawfullyAtLarge: 29,
          unusedRemand: 0,
        },
      },
    })
  },
  stubGetSentencesAndOffences: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/prison-api/api/offender-sentences/booking/1234/sentences-and-offences',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [
          {
            years: 3,
            offences: [
              { offenceEndDate: '2021-02-03' },
              { offenceStartDate: '2021-01-03', offenceEndDate: '2021-01-04' },
              { offenceStartDate: '2021-03-03' },
            ],
          },
        ],
      },
    })
  },
  stubGetUserCaseloads: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/prison-api/api/users/me/caseLoads',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [
          {
            caseloadId: 'MDI',
          },
        ],
      },
    })
  },
}

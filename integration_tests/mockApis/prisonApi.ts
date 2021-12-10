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
            sentenceCalculationType: 'ADIMP',
            sentenceTypeDescription: 'SDS Standard Sentence',
            caseSequence: 1,
            lineSequence: 1,
            sentenceSequence: 1,
            offences: [{ offenceEndDate: '2021-02-03' }],
          },
          {
            years: 2,
            sentenceCalculationType: 'ADIMP',
            caseSequence: 2,
            lineSequence: 2,
            sentenceSequence: 2,
            consecutiveToSequence: 1,
            sentenceTypeDescription: 'SDS Standard Sentence',
            offences: [{ offenceEndDate: '2021-02-05' }],
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
            caseLoadId: 'MDI',
          },
        ],
      },
    })
  },
}

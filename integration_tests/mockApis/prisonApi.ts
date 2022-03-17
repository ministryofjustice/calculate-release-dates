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
        urlPattern: '/prison-api/api/adjustments/1234/sentence-and-booking',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          sentenceAdjustments: [
            {
              sentenceSequence: 1,
              type: 'REMAND',
              numberOfDays: 28,
              fromDate: '2021-02-03',
              toDate: '2021-03-08',
              active: true,
            },
            {
              sentenceSequence: 1,
              type: 'TAGGED_BAIL',
              numberOfDays: 11,
              active: true,
            },
            {
              sentenceSequence: 2,
              type: 'REMAND',
              numberOfDays: 13,
              fromDate: '2021-01-03',
              toDate: '2021-01-15',
              active: false,
            },
            {
              sentenceSequence: 2,
              type: 'TAGGED_BAIL',
              numberOfDays: 7,
              active: false,
            },
          ],
          bookingAdjustments: [
            {
              type: 'UNLAWFULLY_AT_LARGE',
              numberOfDays: 29,
              fromDate: '2021-06-01',
              toDate: '2021-06-10',
              active: true,
            },
            {
              type: 'UNLAWFULLY_AT_LARGE',
              numberOfDays: 10,
              fromDate: '2021-08-01',
              toDate: '2021-08-10',
              active: false,
            },
            {
              type: 'ADDITIONAL_DAYS_AWARDED',
              numberOfDays: 4,
              fromDate: '2021-03-05',
              toDate: '2021-03-08',
              active: false,
            },
            {
              type: 'ADDITIONAL_DAYS_AWARDED',
              numberOfDays: 5,
              fromDate: '2021-07-06',
              toDate: '2021-07-10',
              active: false,
            },
            {
              type: 'RESTORED_ADDITIONAL_DAYS_AWARDED',
              numberOfDays: 3,
              fromDate: '2021-07-08',
              toDate: '2021-07-10',
              active: false,
            },
          ],
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
            terms: [
              {
                years: 3,
              },
            ],
            sentenceCalculationType: 'ADIMP',
            sentenceTypeDescription: 'SDS Standard Sentence',
            caseSequence: 1,
            lineSequence: 1,
            caseReference: 'ABC123',
            sentenceSequence: 1,
            sentenceStatus: 'A',
            offences: [{ offenceEndDate: '2021-02-03' }],
          },
          {
            terms: [
              {
                years: 2,
              },
            ],
            sentenceCalculationType: 'ADIMP',
            caseSequence: 2,
            lineSequence: 2,
            caseReference: 'ABC234',
            sentenceSequence: 2,
            consecutiveToSequence: 1,
            sentenceStatus: 'A',
            sentenceTypeDescription: 'SDS Standard Sentence',
            offences: [{ offenceEndDate: '2021-02-05' }],
          },
          {
            terms: [
              {
                years: 10,
              },
            ],
            sentenceCalculationType: 'ADIMP',
            caseSequence: 2,
            lineSequence: 3,
            caseReference: 'ABC345',
            sentenceSequence: 3,
            consecutiveToSequence: 1,
            sentenceStatus: 'I',
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

import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubCalculatePreliminaryReleaseDates: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: `/calculate-release-dates/calculation/A1234AB`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          dates: {
            SLED: '2018-11-05',
            CRD: '2017-05-07',
            HDCED: '2016-12-24',
          },
          calculationRequestId: 123,
        },
      },
    })
  },
  stubGetCalculationResults: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/calculate-release-dates/calculation/results/([0-9]*)`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          dates: {
            SLED: '2018-11-05',
            CRD: '2017-05-07',
            HDCED: '2016-12-24',
          },
          calculationRequestId: 123,
        },
      },
    })
  },
  stubConfirmCalculation: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: `/calculate-release-dates/calculation/A1234AB/confirm/123`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          dates: {
            SLED: '2018-11-05',
            CRD: '2017-05-07',
            HDCED: '2016-12-24',
          },
          calculationRequestId: 123,
        },
      },
    })
  },
  stubConfirmCalculation_errorNomisDataChanged: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: `/calculate-release-dates/calculation/A1234AB/confirm/98`,
      },
      response: {
        status: 412,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    })
  },
  stubConfirmCalculation_errorServerError: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: `/calculate-release-dates/calculation/A1234AB/confirm/99`,
      },
      response: {
        status: 500,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    })
  },
  stubGetNextWorkingDay: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/calculate-release-dates/working-day/next/2016-12-24`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          date: '2016-12-28',
          adjustedForWeekend: true,
          adjustedForBankHoliday: true,
        },
      },
    })
  },
  stubGetPreviousWorkingDay: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/calculate-release-dates/working-day/previous/2017-05-07`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          date: '2017-05-05',
          adjustedForWeekend: true,
          adjustedForBankHoliday: false,
        },
      },
    })
  },
  stubValidate: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/calculate-release-dates/calculation/A1234AB/validate`,
      },
      response: {
        status: 204,
      },
    })
  },
  stubGetCalculationBreakdown: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/calculate-release-dates/calculation/breakdown/([0-9]*)`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          concurrentSentences: [
            {
              sentencedAt: '2020-07-17',
              sentenceLength: '12 months',
              sentenceLengthDays: 365,
              dates: {
                SLED: {
                  unadjusted: '2021-07-16',
                  adjusted: '2021-07-01',
                  daysFromSentenceStart: 365,
                  adjustedByDays: 15,
                },
                CRD: {
                  unadjusted: '2021-01-15',
                  adjusted: '2021-01-06',
                  daysFromSentenceStart: 183,
                  adjustedByDays: 9,
                },
              },
              lineSequence: 2,
              caseSequence: 2,
            },
            {
              sentencedAt: '2020-12-13',
              sentenceLength: '2 months',
              sentenceLengthDays: 62,
              dates: {
                SLED: {
                  unadjusted: '2021-02-12',
                  adjusted: '2021-01-28',
                  daysFromSentenceStart: 62,
                  adjustedByDays: 15,
                },
                CRD: {
                  unadjusted: '2021-01-12',
                  adjusted: '2021-01-03',
                  daysFromSentenceStart: 31,
                  adjustedByDays: 9,
                },
              },
              lineSequence: 4,
              caseSequence: 4,
            },
          ],
          consecutiveSentence: {
            sentencedAt: '2020-03-20',
            sentenceLength: '5 years 8 months',
            sentenceLengthDays: 2071,
            dates: {
              SLED: {
                unadjusted: '2018-11-20',
                adjusted: '2018-11-05',
                daysFromSentenceStart: 2071,
                adjustedByDays: 15,
              },
              CRD: {
                unadjusted: '2017-05-13',
                adjusted: '2017-05-07',
                daysFromSentenceStart: 1036,
                adjustedByDays: 6,
              },
            },
            sentenceParts: [
              {
                lineSequence: 1,
                caseSequence: 1,
                sentenceLength: '2 years',
                sentenceLengthDays: 730,
                consecutiveToLineSequence: null,
                consecutiveToCaseSequence: null,
              },
              {
                lineSequence: 3,
                caseSequence: 3,
                sentenceLength: '8 months',
                sentenceLengthDays: 242,
                consecutiveToLineSequence: 1,
                consecutiveToCaseSequence: 1,
              },
              {
                lineSequence: 5,
                caseSequence: 5,
                sentenceLength: '3 years',
                sentenceLengthDays: 1095,
                consecutiveToLineSequence: 3,
                consecutiveToCaseSequence: 3,
              },
            ],
          },
          breakdownByReleaseDateType: {},
        },
      },
    })
  },
}

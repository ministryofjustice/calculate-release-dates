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
        urlPattern: `/calculate-release-dates/calculation/results/123`,
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
}

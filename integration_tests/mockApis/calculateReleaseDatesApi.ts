import { SuperAgentRequest } from 'superagent'
import dayjs from 'dayjs'
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
          prisonerId: 'A1234AB',
          bookingId: 1234,
          calculationStatus: 'PRELIMINARY',
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
            CRD: dayjs().add(7, 'day').format('YYYY-MM-DD'),
            HDCED: '2016-12-24',
          },
          calculationRequestId: 123,
          calculationReference: 123,
          prisonerId: 'A1234AB',
          bookingId: 1234,
          calculationStatus: 'CONFIRMED',
          approvedDates: {},
        },
      },
    })
  },
  stubGetGenuineOverride: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/calculate-release-dates/specialist-support/genuine-override/calculation/([0-9]*)`,
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
          calculationReference: 123,
          prisonerId: 'A1234AB',
          bookingId: 1234,
          calculationStatus: 'CONFIRMED',
          approvedDates: {},
        },
      },
    })
  },
  stubConfirmCalculation: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: `/calculate-release-dates/calculation/confirm/123`,
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
          prisonerId: 'A1234AB',
          bookingId: 1234,
          calculationStatus: 'CONFIRMED',
        },
      },
    })
  },
  stubConfirmCalculation_errorNomisDataChanged: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: `/calculate-release-dates/calculation/confirm/98`,
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
        urlPattern: `/calculate-release-dates/calculation/confirm/99`,
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
        urlPattern: `/calculate-release-dates/working-day/next/.*`,
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
        urlPattern: `/calculate-release-dates/working-day/previous/.*`,
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
        method: 'POST',
        urlPattern: `/calculate-release-dates/validation/A1234AB/full-validation`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          type: 'VALID',
          messages: [],
        },
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
              caseReference: 'ABC123',
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
              caseReference: 'ABC234',
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
                caseReference: 'ABC345',
                sentenceLength: '2 years',
                sentenceLengthDays: 730,
                consecutiveToLineSequence: null,
                consecutiveToCaseSequence: null,
              },
              {
                lineSequence: 3,
                caseSequence: 3,
                caseReference: 'ABC567',
                sentenceLength: '8 months',
                sentenceLengthDays: 242,
                consecutiveToLineSequence: 1,
                consecutiveToCaseSequence: 1,
              },
              {
                lineSequence: 5,
                caseSequence: 5,
                caseReference: 'ABC678',
                sentenceLength: '3 years',
                sentenceLengthDays: 1095,
                consecutiveToLineSequence: 3,
                consecutiveToCaseSequence: 3,
              },
            ],
          },
          breakdownByReleaseDateType: {
            CRD: {
              rules: [],
              rulesWithExtraAdjustments: {},
              adjustedDays: -15,
              releaseDate: '2015-07-23',
              unadjustedDate: '2018-11-20',
            },
            SED: {
              rules: [],
              rulesWithExtraAdjustments: {},
              adjustedDays: -6,
              releaseDate: '2015-12-21',
              unadjustedDate: '2017-05-13',
            },
          },
          otherDates: {},
        },
      },
    })
  },
  stubPrisonerDetails: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/calculate-release-dates/calculation/prisoner-details/([0-9]*)`,
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
  stubCalculationUserInputs: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/calculate-release-dates/calculation/calculation-user-input/([0-9]*)`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          sentenceCalculationUserInputs: [
            {
              userInputType: 'ORIGINAL',
              userChoice: true,
              offenceCode: '123',
              sentenceSequence: 1,
            },
          ],
        },
      },
    })
  },
  stubAdjustments: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/calculate-release-dates/calculation/adjustments/([0-9]*)`,
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
  stubSentencesAndOffences: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/calculate-release-dates/calculation/sentence-and-offences/([0-9]*)`,
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
            offences: [{ offenceEndDate: '2021-02-03', offenceCode: '123', offenceDescription: 'Doing a crime' }],
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
            caseReference: 'ABC123',
            sentenceSequence: 2,
            consecutiveToSequence: 1,
            sentenceStatus: 'A',
            sentenceTypeDescription: 'SDS Standard Sentence',
            offences: [{ offenceEndDate: '2021-02-05', offenceDescription: 'Doing a crime' }],
          },
        ],
      },
    })
  },
  stubLatestCalculation: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/calculate-release-dates/calculation/results/A1234AB/1234`,
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
  stubCalculationQuestions: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/calculate-release-dates/calculation/A1234AB/user-questions`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          sentenceQuestions: [
            {
              sentenceSequence: 1,
              userInputType: 'ORIGINAL',
            },
            {
              sentenceSequence: 2,
              userInputType: 'SECTION_250',
            },
          ],
        },
      },
    })
  },
  stubEmptyCalculationQuestions: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/calculate-release-dates/calculation/A1234AB/user-questions`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          sentenceQuestions: [],
        },
      },
    })
  },
  stubSupportedValidation: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/calculate-release-dates/validation/A1234AB/supported-validation',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {},
      },
    })
  },
}

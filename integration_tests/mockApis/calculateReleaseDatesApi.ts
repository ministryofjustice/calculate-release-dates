import { SuperAgentRequest } from 'superagent'
import dayjs from 'dayjs'
import { stubFor } from './wiremock'
import {
  DetailedCalculationResults,
  LatestCalculation,
  SentenceAndOffenceWithReleaseArrangements,
  ValidationMessage,
} from '../../server/@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { components } from '../../server/@types/calculateReleaseDates'

type PreviousOverride = components['schemas']['PreviousGenuineOverride']

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
            HDCED: dayjs().add(3, 'day').format('YYYY-MM-DD'),
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
  stubGetEligibility: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/calculate-release-dates/eligibility/([0-9]*)/ersed`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          isValid: true,
          reason: null,
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
              externalSentenceId: {
                sentenceSequence: 0,
                bookingId: 0,
              },
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
              analysisResult: 'SAME',
            },
            {
              sentenceSequence: 1,
              type: 'TAGGED_BAIL',
              numberOfDays: 11,
              analysisResult: 'SAME',
              active: true,
            },
            {
              sentenceSequence: 2,
              type: 'REMAND',
              numberOfDays: 13,
              fromDate: '2021-01-03',
              toDate: '2021-01-15',
              analysisResult: 'SAME',
              active: false,
            },
            {
              sentenceSequence: 2,
              type: 'TAGGED_BAIL',
              numberOfDays: 7,
              analysisResult: 'SAME',
              active: false,
            },
          ],
          bookingAdjustments: [
            {
              type: 'UNLAWFULLY_AT_LARGE',
              numberOfDays: 29,
              fromDate: '2021-06-01',
              toDate: '2021-06-10',
              analysisResult: 'SAME',
              active: true,
            },
            {
              type: 'UNLAWFULLY_AT_LARGE',
              numberOfDays: 10,
              fromDate: '2021-08-01',
              toDate: '2021-08-10',
              analysisResult: 'SAME',
              active: false,
            },
            {
              type: 'ADDITIONAL_DAYS_AWARDED',
              numberOfDays: 4,
              fromDate: '2021-03-05',
              toDate: '2021-03-08',
              analysisResult: 'SAME',
              active: false,
            },
            {
              type: 'ADDITIONAL_DAYS_AWARDED',
              numberOfDays: 5,
              fromDate: '2021-07-06',
              toDate: '2021-07-10',
              analysisResult: 'SAME',
              active: false,
            },
            {
              type: 'RESTORED_ADDITIONAL_DAYS_AWARDED',
              numberOfDays: 3,
              fromDate: '2021-07-08',
              toDate: '2021-07-10',
              analysisResult: 'SAME',
              active: false,
            },
          ],
        },
      },
    })
  },
  stubAdjustmentsUsingAdjustmentsApi: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/calculate-release-dates/calculation/adjustments/([0-9]*)\\?adjustments\\-api=true`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [
          {
            sentenceSequence: 1,
            adjustmentType: 'REMAND',
            days: 28,
            fromDate: '2021-02-03',
            toDate: '2021-03-08',
            status: 'ACTIVE',
            analysisResult: 'SAME',
          },
          {
            sentenceSequence: 1,
            adjustmentType: 'TAGGED_BAIL',
            days: 11,
            status: 'ACTIVE',
            analysisResult: 'SAME',
          },
          {
            sentenceSequence: 2,
            adjustmentType: 'REMAND',
            days: 13,
            fromDate: '2021-01-03',
            toDate: '2021-01-15',
            status: 'INACTIVE',
            analysisResult: 'SAME',
          },
          {
            sentenceSequence: 2,
            adjustmentType: 'TAGGED_BAIL',
            days: 7,
            status: 'INACTIVE',
            analysisResult: 'SAME',
          },
          {
            adjustmentType: 'UNLAWFULLY_AT_LARGE',
            days: 29,
            fromDate: '2021-06-01',
            toDate: '2021-06-10',
            status: 'ACTIVE',
            analysisResult: 'SAME',
          },
          {
            adjustmentType: 'UNLAWFULLY_AT_LARGE',
            days: 10,
            fromDate: '2021-08-01',
            toDate: '2021-08-10',
            status: 'INACTIVE',
            analysisResult: 'SAME',
          },
          {
            adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
            days: 4,
            fromDate: '2021-03-05',
            toDate: '2021-03-08',
            status: 'INACTIVE',
            analysisResult: 'SAME',
          },
          {
            adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
            days: 5,
            fromDate: '2021-07-06',
            toDate: '2021-07-10',
            status: 'INACTIVE',
            analysisResult: 'SAME',
          },
          {
            adjustmentType: 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED',
            days: 3,
            fromDate: '2021-07-08',
            toDate: '2021-07-10',
            status: 'INACTIVE',
            analysisResult: 'SAME',
          },
        ],
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
            offence: {
              offenceEndDate: '2021-02-03',
              offenceCode: '123',
              offenceDescription: 'Doing a crime',
            },
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
            offence: { offenceEndDate: '2021-02-05', offenceDescription: 'Doing a crime' },
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
  stubManualEntryDateValidation: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/calculate-release-dates/validation/manual-entry-dates-validation\\?releaseDates=([A-Za-z|,]*)',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [],
      },
    })
  },
  stubSupportedValidationNoMessages: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/calculate-release-dates/validation/A1234AB/supported-validation',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [],
      },
    })
  },
  stubSupportedValidationNoOffenceDates: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/calculate-release-dates/validation/A1234AB/supported-validation',
      },
      response: {
        status: 422,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          userMessage: 'no offence end or start dates provided on charge for charge 123',
        },
      },
    })
  },
  stubSupportedValidationNoOffenceTerms: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/calculate-release-dates/validation/A1234AB/supported-validation',
      },
      response: {
        status: 422,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          userMessage: 'missing imprisonment_term_code for charge 123',
        },
      },
    })
  },
  stubSupportedValidationNoOffenceLicenceTerms: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/calculate-release-dates/validation/A1234AB/supported-validation',
      },
      response: {
        status: 422,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          userMessage: 'missing licence_term_code for charge 123',
        },
      },
    })
  },
  stubSupportedValidationUnsupportedSentence: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/calculate-release-dates/validation/A1234AB/supported-validation',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          unsupportedSentenceMessages: [
            {
              type: 'UNSUPPORTED_SENTENCE',
              message: 'Sentence type is not supported',
            } as ValidationMessage,
          ],
          unsupportedCalculationMessages: [],
        },
      },
    })
  },
  stubGetAnalyzedSentenceAdjustments: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/calculate-release-dates/booking-and-sentence-adjustments/([0-9]*)',
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
              analysisResult: 'SAME',
            },
            {
              sentenceSequence: 1,
              type: 'TAGGED_BAIL',
              numberOfDays: 11,
              active: true,
              analysisResult: 'SAME',
            },
            {
              sentenceSequence: 2,
              type: 'REMAND',
              numberOfDays: 13,
              fromDate: '2021-01-03',
              toDate: '2021-01-15',
              active: false,
              analysisResult: 'SAME',
            },
            {
              sentenceSequence: 2,
              type: 'TAGGED_BAIL',
              numberOfDays: 7,
              active: false,
              analysisResult: 'SAME',
            },
          ],
          bookingAdjustments: [
            {
              type: 'UNLAWFULLY_AT_LARGE',
              numberOfDays: 29,
              fromDate: '2021-06-01',
              toDate: '2021-06-10',
              active: true,
              analysisResult: 'SAME',
            },
            {
              type: 'UNLAWFULLY_AT_LARGE',
              numberOfDays: 10,
              fromDate: '2021-08-01',
              toDate: '2021-08-10',
              active: false,
              analysisResult: 'SAME',
            },
            {
              type: 'ADDITIONAL_DAYS_AWARDED',
              numberOfDays: 4,
              fromDate: '2021-03-05',
              toDate: '2021-03-08',
              active: false,
              analysisResult: 'SAME',
            },
            {
              type: 'ADDITIONAL_DAYS_AWARDED',
              numberOfDays: 5,
              fromDate: '2021-07-06',
              toDate: '2021-07-10',
              active: false,
              analysisResult: 'SAME',
            },
            {
              type: 'RESTORED_ADDITIONAL_DAYS_AWARDED',
              numberOfDays: 3,
              fromDate: '2021-07-08',
              toDate: '2021-07-10',
              active: false,
              analysisResult: 'SAME',
            },
          ],
        },
      },
    })
  },
  stubGetAdjustmentsForPrisoner: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/calculate-release-dates/adjustments/A1234AB',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [
          {
            sentenceSequence: 1,
            adjustmentType: 'REMAND',
            days: 28,
            fromDate: '2021-02-03',
            toDate: '2021-03-08',
            status: 'ACTIVE',
            analysisResult: 'SAME',
          },
          {
            sentenceSequence: 1,
            adjustmentType: 'TAGGED_BAIL',
            days: 11,
            status: 'ACTIVE',
            analysisResult: 'SAME',
          },
          {
            sentenceSequence: 2,
            adjustmentType: 'REMAND',
            days: 13,
            fromDate: '2021-01-03',
            toDate: '2021-01-15',
            status: 'INACTIVE',
            analysisResult: 'SAME',
          },
          {
            sentenceSequence: 2,
            adjustmentType: 'TAGGED_BAIL',
            days: 7,
            status: 'INACTIVE',
            analysisResult: 'SAME',
          },
          {
            adjustmentType: 'UNLAWFULLY_AT_LARGE',
            days: 29,
            fromDate: '2021-06-01',
            toDate: '2021-06-10',
            status: 'ACTIVE',
            analysisResult: 'SAME',
          },
          {
            adjustmentType: 'UNLAWFULLY_AT_LARGE',
            days: 10,
            fromDate: '2021-08-01',
            toDate: '2021-08-10',
            status: 'INACTIVE',
            analysisResult: 'SAME',
          },
          {
            adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
            days: 4,
            fromDate: '2021-03-05',
            toDate: '2021-03-08',
            status: 'INACTIVE',
            analysisResult: 'SAME',
          },
          {
            adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
            days: 5,
            fromDate: '2021-07-06',
            toDate: '2021-07-10',
            status: 'INACTIVE',
            analysisResult: 'SAME',
          },
          {
            adjustmentType: 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED',
            days: 3,
            fromDate: '2021-07-08',
            toDate: '2021-07-10',
            status: 'INACTIVE',
            analysisResult: 'SAME',
          },
        ],
      },
    })
  },
  stubGetAnalyzedSentencesAndOffences: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/calculate-release-dates/sentence-and-offence-information/1234',
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
            offence: {
              offenceEndDate: '2021-02-03',
              offenceCode: 'abc',
              offenderChargeId: 111,
              offenceDescription: 'Doing a crime',
            },
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
            offence: {
              offenceEndDate: '2021-02-05',
              offenceCode: 'def',
              offenderChargeId: 222,
              offenceDescription: 'Doing another crime',
            },
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
            offence: { offenceEndDate: '2021-02-05', offenceDescription: 'Doing a crime' },
          },
        ],
      },
    })
  },
  stubGetActiveCalculationReasons: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/calculate-release-dates/calculation-reasons/`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [
          {
            id: 1,
            displayName: 'A reason',
            isOther: 'false',
          },
          {
            id: 2,
            displayName: 'Other',
            isOther: 'true',
          },
        ],
      },
    })
  },
  stubGetGenuineOverrideReasons: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/calculate-release-dates/genuine-override/reasons`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [
          {
            code: 'TERRORISM',
            description: 'Terrorism',
            requiresFurtherDetail: false,
            displayOrder: 0,
          },
          {
            code: 'OTHER',
            description: 'The reason is not on this list',
            requiresFurtherDetail: true,
            displayOrder: 1,
          },
        ],
      },
    })
  },
  stubGetGenuineOverrideInputStandardMode: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/calculate-release-dates/genuine-override/calculation/([0-9]*)/inputs`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          mode: 'STANDARD',
          calculatedDates: [
            { dateType: 'SLED', date: '2018-11-05' },
            { dateType: 'CRD', date: dayjs().add(7, 'day').format('YYYY-MM-DD') },
            { dateType: 'HDCED', date: dayjs().add(3, 'day').format('YYYY-MM-DD') },
          ],
        },
      },
    })
  },
  stubGetGenuineOverrideInputExpressMode: (previousOverride: PreviousOverride): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/calculate-release-dates/genuine-override/calculation/([0-9]*)/inputs`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          mode: 'EXPRESS',
          calculatedDates: [
            { dateType: 'SLED', date: '2018-11-05' },
            { dateType: 'CRD', date: dayjs().add(7, 'day').format('YYYY-MM-DD') },
            { dateType: 'HDCED', date: dayjs().add(3, 'day').format('YYYY-MM-DD') },
          ],
          previousOverrideForExpressGenuineOverride: previousOverride,
        },
      },
    })
  },
  stubGetCalculationHistory: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/calculate-release-dates/historicCalculations/A1234AB`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [
          {
            offenderNo: 'A1234AB',
            calculationDate: '2024-03-05',
            calculationSource: 'CRS',
            commentText: 'a calculation',
            calculationType: 'CALCULATED',
            establishment: 'Kirkham (HMP)',
            calculationRequestId: 3245435,
            calculationReason: 'Transfer',
          },
        ],
      },
    })
  },
  stubGetDetailedCalculationResults: (): SuperAgentRequest => {
    const breakdown = {
      showSds40Hints: false,
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
          externalSentenceId: {
            sentenceSequence: 0,
            bookingId: 0,
          },
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
          externalSentenceId: {
            sentenceSequence: 0,
            bookingId: 0,
          },
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
            externalSentenceId: {
              sentenceSequence: 0,
              bookingId: 0,
            },
          },
          {
            lineSequence: 3,
            caseSequence: 3,
            caseReference: 'ABC567',
            sentenceLength: '8 months',
            sentenceLengthDays: 242,
            consecutiveToLineSequence: 1,
            consecutiveToCaseSequence: 1,
            externalSentenceId: {
              sentenceSequence: 0,
              bookingId: 0,
            },
          },
          {
            lineSequence: 5,
            caseSequence: 5,
            caseReference: 'ABC678',
            sentenceLength: '3 years',
            sentenceLengthDays: 1095,
            consecutiveToLineSequence: 3,
            consecutiveToCaseSequence: 3,
            externalSentenceId: {
              sentenceSequence: 0,
              bookingId: 0,
            },
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
      ersedNotApplicableDueToDtoLaterThanCrd: false,
    }
    const prisonerDetails = {
      offenderNo: 'A1234AB',
      bookingId: 1234,
      firstName: 'Marvin',
      lastName: 'Haggler',
      dateOfBirth: '1965-02-03',
      agencyId: 'MDI',
      alerts: [],
    }
    const sentencesAndOffences = [
      {
        bookingId: 1,
        sentenceCategory: '',
        sentenceDate: '2021-02-03',
        terms: [
          {
            years: 3,
            months: 0,
            weeks: 0,
            days: 0,
            code: 'IMP',
          },
        ],
        sentenceCalculationType: 'ADIMP',
        sentenceTypeDescription: 'SDS Standard Sentence',
        caseSequence: 1,
        lineSequence: 1,
        caseReference: 'ABC123',
        sentenceSequence: 1,
        sentenceStatus: 'A',
        offence: {
          offenderChargeId: 1,
          offenceEndDate: '2021-02-03',
          offenceCode: '123',
          offenceDescription: 'Doing a crime',
          indicators: [],
        },
        isSDSPlus: false,
        hasAnSDSEarlyReleaseExclusion: 'NO',
      } as SentenceAndOffenceWithReleaseArrangements,
      {
        bookingId: 1,
        sentenceCategory: '',
        sentenceDate: '2021-02-03',
        terms: [
          {
            years: 2,
            months: 0,
            weeks: 0,
            days: 0,
            code: 'IMP',
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
        offence: {
          offenderChargeId: 2,
          offenceEndDate: '2021-02-05',
          offenceDescription: 'Doing a crime',
          offenceCode: '123',
          indicators: [],
        },
        isSDSPlus: false,
        hasAnSDSEarlyReleaseExclusion: 'NO',
      } as SentenceAndOffenceWithReleaseArrangements,
    ]
    const detailedResults: DetailedCalculationResults = {
      dates: {
        SLED: { date: '2018-11-05', type: 'SLED', description: 'Sentence and licence expiry date', hints: [] },
        CRD: {
          date: dayjs().add(7, 'day').format('YYYY-MM-DD'),
          type: 'CRD',
          description: 'Conditional release date',
          hints: [{ text: 'Friday, 05 May 2017 when adjusted to a working day' }, { text: 'Manually overridden' }],
        },
        HDCED: {
          date: dayjs().add(3, 'day').format('YYYY-MM-DD'),
          type: 'HDCED',
          description: 'Home detention curfew eligibility date',
          hints: [{ text: 'Wednesday, 28 December 2016 when adjusted to a working day' }],
        },
      },
      context: {
        calculationRequestId: 123,
        calculationReference: '123',
        prisonerId: 'A1234AB',
        bookingId: 1234,
        calculationStatus: 'CONFIRMED',
        calculationType: 'CALCULATED',
      },
      calculationOriginalData: {
        prisonerDetails,
        sentencesAndOffences,
      },
      calculationBreakdown: breakdown,
      approvedDates: {},
    }

    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/calculate-release-dates/calculation/detailed-results/([0-9]*)`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: detailedResults,
      },
    })
  },
  stubGetLatestCalculation: (): SuperAgentRequest => {
    const latestCalculation: LatestCalculation = {
      prisonerId: 'A1234AB',
      bookingId: 1234,
      calculationRequestId: 123,
      calculatedAt: '2024-03-05T10:30:00',
      source: 'CRDS',
      reason: 'Transfer',
      establishment: 'Kirkham (HMP)',
      dates: [
        { date: '2018-11-05', type: 'SLED', description: 'Sentence and licence expiry date', hints: [] },
        {
          date: dayjs().add(7, 'day').format('YYYY-MM-DD'),
          type: 'CRD',
          description: 'Conditional release date',
          hints: [{ text: 'Friday, 05 May 2017 when adjusted to a working day' }],
        },
        {
          date: dayjs().add(3, 'day').format('YYYY-MM-DD'),
          type: 'HDCED',
          description: 'Home detention curfew eligibility date',
          hints: [{ text: 'Wednesday, 28 December 2016 when adjusted to a working day' }],
        },
      ],
    }
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/calculate-release-dates/calculation/A1234AB/latest',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: latestCalculation,
      },
    })
  },
  stubGetLatestCalculationNone: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/calculate-release-dates/calculation/A1234AB/latest',
      },
      response: {
        status: 404,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    })
  },
  stubGetLatestCalculationNoOffenceDates: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/calculate-release-dates/calculation/A1234AB/latest',
      },
      response: {
        status: 422,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          userMessage: 'no offence end or start dates provided on charge for charge 123',
        },
      },
    })
  },
  stubGetLatestCalculationNoOffenceTerms: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/calculate-release-dates/calculation/A1234AB/latest',
      },
      response: {
        status: 422,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          userMessage: 'missing imprisonment_term_code for charge 123',
        },
      },
    })
  },
  stubGetLatestCalculationNoOffenceLicenceTerms: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/calculate-release-dates/calculation/A1234AB/latest',
      },
      response: {
        status: 422,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          userMessage: 'missing licence_term_code for charge 123',
        },
      },
    })
  },
  stubGetCalculationHistoryNone: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/calculate-release-dates/historicCalculations/A1234AB`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [],
      },
    })
  },
  stubGetReferenceDates: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/calculate-release-dates/reference-data/date-type`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [
          { type: 'CRD', description: 'Conditional release date' },
          { type: 'LED', description: 'Licence expiry date' },
          { type: 'SED', description: 'Sentence expiry date' },
          { type: 'NPD', description: 'Non-parole date' },
          { type: 'ARD', description: 'Automatic release date' },
          { type: 'TUSED', description: 'Top up supervision expiry date' },
          { type: 'PED', description: 'Parole eligibility date' },
          { type: 'SLED', description: 'Sentence and licence expiry date' },
          { type: 'HDCED', description: 'Home detention curfew eligibility date' },
          { type: 'NCRD', description: 'Notional conditional release date' },
          { type: 'ETD', description: 'Early transfer date' },
          { type: 'MTD', description: 'Mid transfer date' },
          { type: 'LTD', description: 'Late transfer date' },
          { type: 'DPRRD', description: 'Detention and training order post recall release date' },
          { type: 'PRRD', description: 'Post recall release date' },
          { type: 'ESED', description: 'Effective sentence end date' },
          { type: 'ERSED', description: 'Early removal scheme eligibility date' },
          { type: 'TERSED', description: 'Tariff-expired removal scheme eligibility date' },
          { type: 'APD', description: 'Approved parole date' },
          { type: 'HDCAD', description: 'Home detention curfew approved date' },
          { type: 'None', description: 'None of the above dates apply' },
          { type: 'Tariff', description: 'known as the Tariff expiry date' },
          { type: 'ROTL', description: 'Release on temporary licence' },
        ],
      },
    })
  },
  stubGetBookingManualEntryValidationNoMessages: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/calculate-release-dates/validation/A1234AB/manual-entry-validation`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [],
      },
    })
  },
  stubHasNoIndeterminateSentences: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/calculate-release-dates/manual-calculation/1234/has-indeterminate-sentences`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: false,
      },
    })
  },
  stubHasSomeIndeterminateSentences: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/calculate-release-dates/manual-calculation/1234/has-indeterminate-sentences`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: true,
      },
    })
  },
  stubHasNoRecallSentences: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/calculate-release-dates/manual-calculation/1234/has-recall-sentences`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: false,
      },
    })
  },
  stubSaveManualEntry: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: '/calculate-release-dates/manual-calculation/A1234AB',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          calculationRequestId: 123,
          enteredDates: { SED: '2026-06-01', CRD: '2027-09-03', MTD: '2028-03-09' },
        },
      },
    })
  },
  stubExistingManualJourney: (flag: boolean): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/calculate-release-dates/manual-calculation/A1234AB/has-existing-calculation',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: flag,
      },
    })
  },
  stubCreateGenuineOverride: (opts: { originalCalcId: number; newCalcId: number }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: `/calculate-release-dates/genuine-override/calculation/${opts.originalCalcId}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          originalCalculationRequestId: opts.originalCalcId,
          newCalculationRequestId: opts.newCalcId,
        },
      },
    })
  },
}

import nock from 'nock'
import CalculateReleaseDatesService from './calculateReleaseDatesService'
import config from '../config'
import {
  BookingCalculation,
  CalculationBreakdown,
  ValidationMessages,
  WorkingDay,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { ErrorMessageType } from '../types/ErrorMessages'
import { psiExample16CalculationBreakdown, psiExample25CalculationBreakdown } from './breakdownExamplesTestData'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/PrisonApiOffenderSentenceAndOffences'

jest.mock('../data/hmppsAuthClient')

const prisonerId = 'A1234AB'
const calculationRequestId = 123456
const calculationResults: BookingCalculation = {
  dates: {
    CRD: '2021-02-03',
    SLED: '2021-10-28',
    HDCED: '2021-10-10',
  },
  effectiveSentenceLength: null,
  calculationRequestId,
  prisonerId,
  bookingId: 123,
  calculationStatus: 'CONFIRMED',
}
const calculationBreakdown: CalculationBreakdown = {
  concurrentSentences: [
    {
      dates: {
        CRD: {
          adjusted: '2021-02-03',
          unadjusted: '2021-01-15',
          adjustedByDays: 18,
          daysFromSentenceStart: 100,
        },
        SLED: {
          adjusted: '2021-10-28',
          unadjusted: '2021-01-15',
          adjustedByDays: 18,
          daysFromSentenceStart: 100,
        },
      },
      sentenceLength: '2 years',
      sentenceLengthDays: 785,
      sentencedAt: '2020-01-01',
      lineSequence: 2,
      caseSequence: 1,
    },
  ],
  breakdownByReleaseDateType: {},
  otherDates: {},
}

const sentencesAndOffences = [
  {
    caseSequence: 2,
    lineSequence: 3,
    sentenceDate: '2020-02-05',
    sentenceCalculationType: 'ADIMP_ORA',
    offences: [
      { offenceEndDate: '2021-02-03' },
      { offenceStartDate: '2021-01-04', offenceEndDate: '2021-01-05' },
      { offenceStartDate: '2021-03-06' },
      {},
      { offenceStartDate: '2021-01-07', offenceEndDate: '2021-01-07' },
    ],
    sentenceSequence: 4,
  } as PrisonApiOffenderSentenceAndOffences,
  {
    caseSequence: 1,
    lineSequence: 1,
    sentenceDate: '2021-02-05',
    sentenceCalculationType: 'ADIMP_ORA',
    terms: [
      {
        days: 1,
      },
    ],
    offences: [{ offenceCode: 'GBH' }],
    sentenceSequence: 1,
  } as PrisonApiOffenderSentenceAndOffences,
  {
    caseSequence: 2,
    lineSequence: 2,
    sentenceDate: '2021-02-05',
    sentenceCalculationType: 'ADIMP_ORA',
    terms: [
      {
        days: 1,
      },
    ],
    offences: [{ offenceStartDate: '2021-04-03', offenceEndDate: '2021-04-03' }],
    sentenceSequence: 3,
  } as PrisonApiOffenderSentenceAndOffences,
  {
    caseSequence: 1,
    lineSequence: 2,
    sentenceDate: '2021-02-05',
    sentenceCalculationType: 'ADIMP_ORA',
    terms: [
      {
        days: 1,
      },
    ],
    offences: [{ offenceCode: 'GBH', offenceStartDate: '2021-04-03' }],
    sentenceSequence: 2,
  } as PrisonApiOffenderSentenceAndOffences,
]

const invalidValidationResult: ValidationMessages = {
  type: 'VALIDATION',
  messages: [
    {
      code: 'OFFENCE_MISSING_DATE',
      sentenceSequence: 1,
      message: '',
      arguments: [],
    },
    {
      code: 'OFFENCE_DATE_AFTER_SENTENCE_START_DATE',
      sentenceSequence: 2,
      message: '',
      arguments: [],
    },
    {
      code: 'OFFENCE_DATE_AFTER_SENTENCE_START_DATE',
      sentenceSequence: 3,
      message: '',
      arguments: [],
    },
    {
      code: 'OFFENCE_DATE_AFTER_SENTENCE_RANGE_DATE',
      sentenceSequence: 3,
      message: '',
      arguments: [],
    },
    {
      code: 'OFFENCE_MISSING_DATE',
      sentenceSequence: 4,
      message: '',
      arguments: [],
    },
    {
      code: 'OFFENCE_DATE_AFTER_SENTENCE_START_DATE',
      sentenceSequence: 4,
      message: '',
      arguments: [],
    },
    {
      code: 'OFFENCE_DATE_AFTER_SENTENCE_RANGE_DATE',
      sentenceSequence: 4,
      message: '',
      arguments: [],
    },
    {
      code: 'SENTENCE_HAS_NO_IMPRISONMENT_DURATION',
      sentenceSequence: 4,
      message: '',
      arguments: [],
    },
    {
      code: 'SENTENCE_HAS_MULTIPLE_TERMS',
      sentenceSequence: 4,
      message: '',
      arguments: [],
    },
    {
      code: 'MULTIPLE_SENTENCES_CONSECUTIVE_TO',
      sentenceSequence: 4,
      message: '',
      arguments: [],
    },
    {
      code: 'SEC_91_SENTENCE_TYPE_INCORRECT',
      sentenceSequence: 4,
      message: '',
      arguments: [],
    },
    {
      code: 'SENTENCE_HAS_NO_LICENCE_DURATION',
      sentenceSequence: 4,
      message: '',
      arguments: [],
    },
    {
      code: 'LICENCE_TERM_LESS_THAN_ONE_YEAR',
      sentenceSequence: 4,
      message: '',
      arguments: [],
    },
    {
      code: 'LICENCE_TERM_MORE_THAN_EIGHT_YEARS',
      sentenceSequence: 4,
      message: '',
      arguments: [],
    },
    {
      code: 'EDS18_EDS21_EDSU18_SENTENCE_TYPE_INCORRECT',
      sentenceSequence: 4,
      message: '',
      arguments: [],
    },
    {
      code: 'LASPO_AR_SENTENCE_TYPE_INCORRECT',
      sentenceSequence: 4,
      message: '',
      arguments: [],
    },
    {
      code: 'REMAND_FROM_TO_DATES_REQUIRED',
      message: '',
      arguments: [],
    },
    {
      code: 'REMAND_FROM_TO_DATES_REQUIRED',
      message: '',
      arguments: [],
    },
    {
      code: 'ADJUSTMENT_FUTURE_DATED',
      message: '',
      arguments: ['UNLAWFULLY_AT_LARGE', 'ADDITIONAL_DAYS_AWARDED'],
    },
    {
      code: 'REMAND_OVERLAPS_WITH_REMAND',
      message: '',
      arguments: [],
    },
    {
      code: 'REMAND_OVERLAPS_WITH_SENTENCE',
      message: '',
      arguments: [],
    },
    {
      code: 'CUSTODIAL_PERIOD_EXTINGUISHED',
      message: '',
      arguments: ['REMAND'],
    },
    {
      code: 'CUSTODIAL_PERIOD_EXTINGUISHED',
      message: '',
      arguments: ['TAGGED BAIL'],
    },
    {
      code: 'CUSTODIAL_PERIOD_EXTINGUISHED',
      message: '',
      arguments: ['REMAND', 'TAGGED BAIL'],
    },
    {
      code: 'ADJUSTMENT_AFTER_RELEASE',
      message: '',
      arguments: ['ADDITIONAL_DAYS_AWARDED', 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED', 'UNLAWFULLY_AT_LARGE'],
    },
  ],
}

const unsupportedValidationResult: ValidationMessages = {
  type: 'UNSUPPORTED',
  messages: [
    {
      code: 'UNSUPPORTED_SENTENCE_TYPE',
      sentenceSequence: 1,
      message: '',
      arguments: ['This sentence is unsupported'],
    },
  ],
}

const token = 'token'

describe('Calculate release dates service tests', () => {
  let calculateReleaseDatesService: CalculateReleaseDatesService
  let fakeApi: nock.Scope
  beforeEach(() => {
    config.apis.calculateReleaseDates.url = 'http://localhost:8100'
    fakeApi = nock(config.apis.calculateReleaseDates.url)
    calculateReleaseDatesService = new CalculateReleaseDatesService()
  })
  afterEach(() => {
    nock.cleanAll()
  })

  describe('calculatePreliminaryReleaseDates', () => {
    it('Test the running of a preliminary calculation of release dates', async () => {
      fakeApi.post(`/calculation/${prisonerId}`).reply(200, calculationResults)

      const result = await calculateReleaseDatesService.calculatePreliminaryReleaseDates(
        'user',
        prisonerId,
        null,
        token
      )

      expect(result).toEqual(calculationResults)
    })
  })

  it('Test getting the results of a calculation by the calculationRequestId', async () => {
    fakeApi.get(`/calculation/results/${calculationRequestId}`).reply(200, calculationResults)

    const result = await calculateReleaseDatesService.getCalculationResults('user', calculationRequestId, token)

    expect(result).toEqual(calculationResults)
  })

  it('Test confirming the results of a calculation', async () => {
    fakeApi.post(`/calculation/${prisonerId}/confirm/${calculationRequestId}`).reply(200, calculationResults)

    const result = await calculateReleaseDatesService.confirmCalculation(
      'user',
      prisonerId,
      calculationRequestId,
      token,
      {
        breakdownHtml: '',
      }
    )

    expect(result).toEqual(calculationResults)
  })

  it('Test weekend adjustments', async () => {
    const adjustedCrd: WorkingDay = {
      date: '2021-10-27',
      adjustedForBankHoliday: false,
      adjustedForWeekend: true,
    }
    const adjustedHdced: WorkingDay = {
      date: '2021-10-29',
      adjustedForBankHoliday: false,
      adjustedForWeekend: true,
    }

    fakeApi.get(`/working-day/previous/${calculationResults.dates.CRD}`).reply(200, adjustedCrd)
    fakeApi.get(`/working-day/next/${calculationResults.dates.HDCED}`).reply(200, adjustedHdced)

    const result = await calculateReleaseDatesService.getWeekendAdjustments('user', calculationResults, token)

    expect(result).toEqual({
      HDCED: adjustedHdced,
      CRD: adjustedCrd,
    })
  })

  describe('Test getting effective dates and breakdown', () => {
    it('Test data', async () => {
      fakeApi.get(`/calculation/breakdown/${calculationRequestId}`).reply(200, calculationBreakdown)

      const result = await calculateReleaseDatesService.getBreakdown(calculationRequestId, token)

      expect(result.calculationBreakdown).toEqual(calculationBreakdown)
    })

    it('PSI example 16', async () => {
      fakeApi.get(`/calculation/breakdown/${calculationRequestId}`).reply(200, psiExample16CalculationBreakdown())

      const result = await calculateReleaseDatesService.getBreakdown(calculationRequestId, token)

      expect(result.calculationBreakdown).toEqual(psiExample16CalculationBreakdown())

      expect(result.releaseDatesWithAdjustments).toEqual([
        {
          releaseDate: '2015-07-28',
          releaseDateType: 'LED',
          hintText: '11 August 2015 minus 14 days',
        },
        {
          hintText: '11 October 2015 minus 14 days',
          releaseDate: '2015-09-27',
          releaseDateType: 'SED',
        },
        {
          hintText: '12 June 2015 minus 14 days',
          releaseDate: '2015-05-29',
          releaseDateType: 'CRD',
        },
        {
          releaseDate: '2015-03-28',
          releaseDateType: 'HDCED',
          hintText: '16 February 2015 plus 61 days minus 21 days',
        },
        {
          releaseDate: '2016-05-26',
          releaseDateType: 'TUSED',
          hintText: '16 June 2015 plus 12 months minus 21 days',
        },
      ])
    })

    it('PSI example 25', async () => {
      fakeApi.get(`/calculation/breakdown/${calculationRequestId}`).reply(200, psiExample25CalculationBreakdown())

      const result = await calculateReleaseDatesService.getBreakdown(calculationRequestId, token)

      expect(result.calculationBreakdown).toEqual(psiExample25CalculationBreakdown())

      expect(result.releaseDatesWithAdjustments).toEqual([
        {
          hintText: '14 July 2015 plus 44 days',
          releaseDate: '2015-08-27',
          releaseDateType: 'LED',
        },
        {
          hintText: '21 December 2015 plus 0 days',
          releaseDate: '2015-12-21',
          releaseDateType: 'SED',
        },
        {
          hintText: '23 July 2015 plus 0 days',
          releaseDate: '2015-07-23',
          releaseDateType: 'CRD',
        },
        {
          releaseDate: '2015-03-28',
          releaseDateType: 'HDCED',
          hintText: '16 February 2015 plus 61 days minus 21 days',
        },
        {
          releaseDate: '2016-05-26',
          releaseDateType: 'TUSED',
          hintText: '16 June 2015 plus 12 months minus 21 days',
        },
      ])
    })
  })

  describe('Validation tests', () => {
    it('Test validation passes', async () => {
      fakeApi.post(`/calculation/${prisonerId}/validate`).reply(204)
      const result = await calculateReleaseDatesService.validateBackend(prisonerId, null, sentencesAndOffences, token)
      expect(result.messages).toEqual([])
    })

    it('Test for validation mapping', async () => {
      fakeApi.post(`/calculation/${prisonerId}/validate`).reply(200, invalidValidationResult)

      const result = await calculateReleaseDatesService.validateBackend(prisonerId, null, sentencesAndOffences, token)

      expect(result.messages).toEqual([
        { text: 'The calculation must include an offence date for court case 1 count 1.' },
        { text: 'The offence date for court case 1 count 2 must be before the sentence date.' },
        { text: 'The offence date for court case 2 count 2 must be before the sentence date.' },
        { text: 'The offence date range for court case 2 count 2 must be before the sentence date.' },
        { text: 'The calculation must include an offence date for court case 2 count 3.' },
        { text: 'The offence date for court case 2 count 3 must be before the sentence date.' },
        { text: 'The offence date range for court case 2 count 3 must be before the sentence date.' },
        { text: 'You must enter a length of time for the term of imprisonment for court case 2 count 3.' },
        { text: 'Court case 2 count 3 must only have one term in NOMIS.' },
        {
          text: 'There are multiple sentences that are consecutive to court case 2 count 3. A sentence should only have one other sentence consecutive to it.',
        },
        {
          text: 'The sentence type for court case 2 count 3 is invalid for the sentence date entered.',
        },
        {
          text: 'Court case 2 count 3 must include a licence term.',
        },
        {
          text: 'Court court case 2 count 3 must have a licence term of at least one year.',
        },
        {
          text: 'Court case court case 2 count 3 must have a licence term that does not exceed 8 years.',
        },
        {
          text: 'The sentence type for court case 2 count 3 is invalid for the sentence date entered.',
        },
        {
          text: 'The sentence type for court case 2 count 3 is invalid for the sentence date entered.',
        },
        { text: 'Remand periods must have a from and to date.' },
        { text: 'Remand periods must have a from and to date.' },
        { text: 'The from date for Unlawfully at large (UAL) must be the first day the prisoner was deemed UAL.' },
        { text: 'The from date for Additional days awarded (ADA) should be the date of the adjudication hearing.' },
        { text: 'Remand time can only be added once, it can cannot overlap with other remand dates.' },
        { text: 'Remand time cannot be credited when a custodial sentence is being served.' },
        {
          text: 'The release date cannot be before the sentence date. Go back to NOMIS and reduce the amount of remand entered.',
        },
        {
          text: 'The release date cannot be before the sentence date. Go back to NOMIS and reduce the amount of tagged bail entered.',
        },
        {
          text: 'The release date cannot be before the sentence date. Go back to NOMIS and reduce the amount of remand and tagged bail entered.',
        },
        {
          text: 'The from date for Additional days awarded (ADA) should be the date of the adjudication hearing.',
        },
        {
          text: 'The from date for Restored additional days awarded (RADA) must be the date the additional days were remitted.',
        },
        {
          text: 'The from date for Unlawfully at large (UAL) must be the first day the prisoner was deemed UAL.',
        },
      ])
      expect(result.messageType).toBe(ErrorMessageType.VALIDATION)
    })
    it('Test for unsupported sentences', async () => {
      fakeApi.post(`/calculation/${prisonerId}/validate`).reply(200, unsupportedValidationResult)

      const result = await calculateReleaseDatesService.validateBackend(
        prisonerId,
        null,
        [
          {
            sentenceCalculationType: 'UNSUPORTED',
            sentenceTypeDescription: 'This sentence is unsupported',
            sentenceSequence: 1,
          },
        ],
        token
      )

      expect(result.messages).toEqual([{ text: 'This sentence is unsupported' }])
      expect(result.messageType).toBe(ErrorMessageType.UNSUPPORTED)
    })
  })
})

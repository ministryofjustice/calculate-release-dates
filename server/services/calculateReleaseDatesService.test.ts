import nock from 'nock'
import CalculateReleaseDatesService from './calculateReleaseDatesService'
import config from '../config'
import {
  BookingCalculation,
  CalculationBreakdown,
  NonFridayReleaseDay,
  ValidationMessage,
  WorkingDay,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import {
  ersedAdjustedByArdBreakdown,
  ersedBeforeSentenceBreakdown,
  ersedHalfwayBreakdown,
  ersedOneYearBreakdown,
  ersedTwoThirdsBreakdown,
  psiExample16CalculationBreakdown,
  psiExample25CalculationBreakdown,
} from './breakdownExamplesTestData'

jest.mock('../data/hmppsAuthClient')

const prisonerId = 'A1234AB'
const calculationRequestId = 123456
const calculationResults: BookingCalculation = {
  dates: {
    CRD: '2021-02-03',
    SLED: '2021-10-28',
    HDCED: '2021-10-10',
    PED: '2022-09-04',
  },
  effectiveSentenceLength: null,
  calculationReference: 'ABC123',
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

const validResult: ValidationMessage[] = []

const invalidValidationResult: ValidationMessage[] = [
  {
    code: 'OFFENCE_MISSING_DATE',
    message: 'Validation failed 1',
    arguments: [],
    type: 'VALIDATION',
  },
  {
    code: 'OFFENCE_MISSING_DATE',
    message: 'Validation failed 2',
    arguments: [],
    type: 'VALIDATION',
  },
]

const unsupportedValidationResult: ValidationMessage[] = [
  {
    code: 'UNSUPPORTED_SENTENCE_TYPE',
    message: 'Unsupported sentence 1',
    arguments: [],
    type: 'UNSUPPORTED_SENTENCE',
  },
  {
    code: 'UNSUPPORTED_SENTENCE_TYPE',
    message: 'Unsupported sentence 2',
    arguments: [],
    type: 'UNSUPPORTED_SENTENCE',
  },
]

const unsupportedCalculationResult: ValidationMessage[] = [
  {
    code: 'A_FINE_SENTENCE_CONSECUTIVE',
    message: 'Unsupported calculation 1',
    arguments: [],
    type: 'UNSUPPORTED_CALCULATION',
  },
  {
    code: 'A_FINE_SENTENCE_CONSECUTIVE_TO',
    message: 'Unsupported calculation 2',
    arguments: [],
    type: 'UNSUPPORTED_CALCULATION',
  },
]

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
    fakeApi.post(`/calculation/confirm/${calculationRequestId}`).reply(200, calculationResults)

    const result = await calculateReleaseDatesService.confirmCalculation('user', calculationRequestId, token, {
      calculationFragments: {
        breakdownHtml: '',
      },
      approvedDates: [],
    })

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
    const adjustedPed: WorkingDay = {
      date: '2022-09-02',
      adjustedForBankHoliday: false,
      adjustedForWeekend: true,
    }

    fakeApi.get(`/working-day/previous/${calculationResults.dates.CRD}`).reply(200, adjustedCrd)
    fakeApi.get(`/working-day/next/${calculationResults.dates.HDCED}`).reply(200, adjustedHdced)
    fakeApi.get(`/working-day/previous/${calculationResults.dates.PED}`).reply(200, adjustedPed)

    const result = await calculateReleaseDatesService.getWeekendAdjustments('user', calculationResults, token)

    expect(result).toEqual({
      HDCED: adjustedHdced,
      CRD: adjustedCrd,
      PED: adjustedPed,
    })
  })

  it('Test non Friday release dates turned on', async () => {
    config.featureToggles.nonFridayRelease = true
    const adjustedCrd: NonFridayReleaseDay = {
      date: '2021-10-27',
      usePolicy: true,
    }

    fakeApi.get(`/non-friday-release/${calculationResults.dates.CRD}`).reply(200, adjustedCrd)

    const result = await calculateReleaseDatesService.getNonFridayReleaseAdjustments(calculationResults, token)

    expect(result).toEqual({
      CRD: adjustedCrd,
    })
  })

  it('Test non Friday release dates turned off', async () => {
    config.featureToggles.nonFridayRelease = false
    const adjustedCrd: NonFridayReleaseDay = {
      date: '2021-10-27',
      usePolicy: true,
    }

    fakeApi.get(`/non-friday-release/${calculationResults.dates.CRD}`).reply(200, adjustedCrd)

    const result = await calculateReleaseDatesService.getNonFridayReleaseAdjustments(calculationResults, token)

    expect(result).toEqual({})
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

    it('ERSED halfway', async () => {
      fakeApi.get(`/calculation/breakdown/${calculationRequestId}`).reply(200, ersedHalfwayBreakdown())

      const result = await calculateReleaseDatesService.getBreakdown(calculationRequestId, token)

      expect(result.calculationBreakdown).toEqual(ersedHalfwayBreakdown())

      expect(result.releaseDatesWithAdjustments).toEqual([
        { hintText: '01 December 2010 plus 50 days', releaseDate: '2010-12-01', releaseDateType: 'ERSED' },
      ])
    })
    it('ERSED two thirds', async () => {
      fakeApi.get(`/calculation/breakdown/${calculationRequestId}`).reply(200, ersedTwoThirdsBreakdown())

      const result = await calculateReleaseDatesService.getBreakdown(calculationRequestId, token)

      expect(result.calculationBreakdown).toEqual(ersedTwoThirdsBreakdown())

      expect(result.releaseDatesWithAdjustments).toEqual([
        { hintText: '20 March 2023 plus 66 days', releaseDate: '2023-03-20', releaseDateType: 'ERSED' },
      ])
    })
    it('ERSED one year', async () => {
      fakeApi.get(`/calculation/breakdown/${calculationRequestId}`).reply(200, ersedOneYearBreakdown())

      const result = await calculateReleaseDatesService.getBreakdown(calculationRequestId, token)

      expect(result.calculationBreakdown).toEqual(ersedOneYearBreakdown())

      expect(result.releaseDatesWithAdjustments).toEqual([
        {
          hintText: '28 July 2024 plus 100 days minus 12 months',
          releaseDate: '2023-07-28',
          releaseDateType: 'ERSED',
        },
      ])
    })
    it('ERSED adjusted to afine', async () => {
      fakeApi.get(`/calculation/breakdown/${calculationRequestId}`).reply(200, ersedAdjustedByArdBreakdown())

      const result = await calculateReleaseDatesService.getBreakdown(calculationRequestId, token)

      expect(result.calculationBreakdown).toEqual(ersedAdjustedByArdBreakdown())

      expect(result.releaseDatesWithAdjustments.find(it => it.releaseDateType === 'ERSED')).toBeFalsy()
    })
    it('ERSED before sentence date', async () => {
      fakeApi.get(`/calculation/breakdown/${calculationRequestId}`).reply(200, ersedBeforeSentenceBreakdown())

      const result = await calculateReleaseDatesService.getBreakdown(calculationRequestId, token)

      expect(result.calculationBreakdown).toEqual(ersedBeforeSentenceBreakdown())

      expect(result.releaseDatesWithAdjustments.find(it => it.releaseDateType === 'ERSED')).toBeFalsy()
    })
  })

  describe('Validation tests', () => {
    it('Test validation passes', async () => {
      fakeApi.post(`/validation/${prisonerId}/full-validation`).reply(200, validResult)
      const result = await calculateReleaseDatesService.validateBackend(prisonerId, null, token)
      expect(result).toEqual({
        messages: [],
      })
    })

    it('Test for validation type errors', async () => {
      fakeApi.post(`/validation/${prisonerId}/full-validation`).reply(200, invalidValidationResult)

      const result = await calculateReleaseDatesService.validateBackend(prisonerId, null, token)

      expect(result).toEqual({
        messages: [{ text: 'Validation failed 1' }, { text: 'Validation failed 2' }],
        messageType: 'VALIDATION',
      })
    })
    it('Test for unsupported sentences', async () => {
      fakeApi.post(`/validation/${prisonerId}/full-validation`).reply(200, unsupportedValidationResult)

      const result = await calculateReleaseDatesService.validateBackend(prisonerId, null, token)

      expect(result).toEqual({
        messages: [{ text: 'Unsupported sentence 1' }, { text: 'Unsupported sentence 2' }],
        messageType: 'UNSUPPORTED_SENTENCE',
      })
    })

    it('Test for unsupported calculation', async () => {
      fakeApi.post(`/validation/${prisonerId}/full-validation`).reply(200, unsupportedCalculationResult)

      const result = await calculateReleaseDatesService.validateBackend(prisonerId, null, token)

      expect(result).toEqual({
        messages: [{ text: 'Unsupported calculation 1' }, { text: 'Unsupported calculation 2' }],
        messageType: 'UNSUPPORTED_CALCULATION',
      })
    })
  })
})

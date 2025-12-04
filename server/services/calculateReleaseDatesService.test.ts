import nock from 'nock'
import dayjs from 'dayjs'
import {
  Action,
  LatestCalculationCardConfig,
} from '@ministryofjustice/hmpps-court-cases-release-dates-design/hmpps/@types'
import CalculateReleaseDatesService from './calculateReleaseDatesService'
import config from '../config'
import {
  BookingCalculation,
  CalculationBreakdown,
  DetailedCalculationResults,
  GenuineOverrideCreatedResponse,
  LatestCalculation,
  ValidationMessage,
  WorkingDay,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import {
  ersedAdjustedByArdBreakdown,
  ersedBeforeSentenceBreakdown,
  ersedHalfwayBreakdown,
  ersedTwoThirdsBreakdown,
  psiExample16CalculationBreakdown,
  psiExample25CalculationBreakdown,
} from './breakdownExamplesTestData'
import AuditService from './auditService'
import { FullPageError } from '../types/FullPageError'

jest.mock('../data/hmppsAuthClient')
jest.mock('./auditService')

const userName = 'USERNAME'
const nomsId = 'A1234AB'
const prisonerId = 'A1234AB'
const calculationRequestId = 123456
const offenderSentCalcId = 123456
const nomisCalculationSummary = { reason: 'Adjust Sentence', calculatedAt: '2024-04-18T10:47:39' }
const releaseDatesAndCalcContext = {
  calculation: {
    calculationRequestId: 51124,
    bookingId: 1201571,
    prisonerId: 'A8031DY',
    calculationStatus: 'CONFIRMED',
    calculationReference: '1a22bffd-b224-49af-b7b0-338cf3b42664',
    calculationReason: {
      id: 8,
      isOther: false,
      displayName: '14 day check',
    },
    otherReasonDescription: '',
    calculationDate: '2024-05-09',
    calculationType: 'CALCULATED',
  },
  dates: [
    {
      type: 'SLED',
      description: 'Sentence and licence expiry date',
      date: '2027-11-01',
      hints: [],
    },
  ],
}
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
  calculationType: 'CALCULATED',
  calculationStatus: 'CONFIRMED',
}
const calculationBreakdown: CalculationBreakdown = {
  showSds40Hints: false,
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
      externalSentenceId: {
        sentenceSequence: 0,
        bookingId: 0,
      },
    },
  ],
  breakdownByReleaseDateType: {},
  otherDates: {},
  ersedNotApplicableDueToDtoLaterThanCrd: false,
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
  const auditService = new AuditService() as jest.Mocked<AuditService>
  beforeEach(() => {
    auditService.publishSentenceCalculation.mockResolvedValue()
    auditService.publishSentenceCalculationFailure.mockResolvedValue()
    config.apis.calculateReleaseDates.url = 'http://localhost:8100'
    fakeApi = nock(config.apis.calculateReleaseDates.url)
    calculateReleaseDatesService = new CalculateReleaseDatesService(auditService)
  })
  afterEach(() => {
    nock.cleanAll()
    jest.resetAllMocks()
  })

  describe('Test GET releases date using a calculation request id', () => {
    it('asserting successful scenario', async () => {
      fakeApi.get(`/calculation/release-dates/${calculationRequestId}`).reply(200, releaseDatesAndCalcContext)

      const result = await calculateReleaseDatesService.getReleaseDatesForACalcReqId(calculationRequestId, token)

      expect(result).toEqual(releaseDatesAndCalcContext)
    })
    it('asserting fail scenario', async () => {
      fakeApi.get(`/calculation/release-dates/${calculationRequestId}`).reply(404)

      await expect(
        calculateReleaseDatesService.getReleaseDatesForACalcReqId(calculationRequestId, token),
      ).rejects.toThrow('Not Found')
    })
  })

  describe('Test nomis calculation summary', () => {
    it('asserting successful scenario', async () => {
      fakeApi.get(`/calculation/nomis-calculation-summary/${offenderSentCalcId}`).reply(200, nomisCalculationSummary)
      const result = await calculateReleaseDatesService.getNomisCalculationSummary(offenderSentCalcId, token)
      expect(result).toEqual(nomisCalculationSummary)
    })
    it('asserting fail scenario', async () => {
      fakeApi.get(`/calculation/nomis-calculation-summary/${offenderSentCalcId}`).reply(404)
      await expect(calculateReleaseDatesService.getNomisCalculationSummary(offenderSentCalcId, token)).rejects.toThrow(
        'Not Found',
      )
    })
  })

  describe('calculatePreliminaryReleaseDates', () => {
    it('Test the running of a preliminary calculation of release dates', async () => {
      fakeApi.post(`/calculation/${prisonerId}`).reply(200, calculationResults)

      const result = await calculateReleaseDatesService.calculatePreliminaryReleaseDates(prisonerId, null, token)

      expect(result).toEqual(calculationResults)
    })
  })

  it('Test getting the results of a calculation by the calculationRequestId', async () => {
    fakeApi.get(`/calculation/results/${calculationRequestId}`).reply(200, calculationResults)

    const result = await calculateReleaseDatesService.getCalculationResults(calculationRequestId, token)

    expect(result).toEqual(calculationResults)
  })

  it('Test confirming the results of a calculation', async () => {
    fakeApi.post(`/calculation/confirm/${calculationRequestId}`).reply(200, calculationResults)

    const result = await calculateReleaseDatesService.confirmCalculation(
      userName,
      nomsId,
      calculationRequestId,
      token,
      {
        calculationFragments: {
          breakdownHtml: '',
        },
        approvedDates: [],
      },
    )

    expect(result).toEqual(calculationResults)
  })

  it('Test weekend adjustments', async () => {
    const hdced = dayjs().add(10, 'day').format('YYYY-MM-DD')

    const adjustedHdced: WorkingDay = {
      date: '2021-10-29',
      adjustedForBankHoliday: false,
      adjustedForWeekend: true,
    }

    fakeApi.get(`/working-day/next/${hdced}`).reply(200, adjustedHdced)

    const result = await calculateReleaseDatesService.getNextWorkingDay(hdced, token)

    expect(result).toEqual(adjustedHdced.date)
  })

  it('weekend adjustments in the past do not appear', async () => {
    const result = await calculateReleaseDatesService.getNextWorkingDay('2021-10-10', token)
    expect(result).toBeNull()
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
    it('returns all validation messages from sentence, calculation, and manual entry', async () => {
      const mockResponse = {
        unsupportedSentenceMessages: [
          { type: 'UNSUPPORTED_SENTENCE', message: 'Unsupported sentence' } as ValidationMessage,
        ],
        unsupportedCalculationMessages: [
          { type: 'UNSUPPORTED_CALCULATION', message: 'Unsupported calculation' } as ValidationMessage,
        ],
        unsupportedManualMessages: [
          { type: 'MANUAL_ENTRY_JOURNEY_REQUIRED', message: 'Manual input required' } as ValidationMessage,
        ],
      }

      // Mock the API endpoint
      fakeApi.get(`/validation/${prisonerId}/supported-validation`).reply(200, mockResponse)

      const result = await calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages(prisonerId, token)

      expect(result).toHaveLength(3)
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ message: 'Unsupported sentence' }),
          expect.objectContaining({ message: 'Unsupported calculation' }),
          expect.objectContaining({ message: 'Manual input required' }),
        ]),
      )
    })

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

    it('Test for consecutive concurrent calculation', async () => {
      fakeApi.post(`/validation/${prisonerId}/full-validation`).reply(200, [
        {
          code: 'CONCURRENT_CONSECUTIVE_SENTENCES_DURATION',
          message: '10 years 9 months 8 weeks 7 days',
          type: 'CONCURRENT_CONSECUTIVE',
        } as ValidationMessage,
      ])

      const result = await calculateReleaseDatesService.validateBackend(prisonerId, null, token)

      expect(result).toEqual({
        messages: [{ text: '10 years 9 months 8 weeks 7 days' }],
        messageType: 'CONCURRENT_CONSECUTIVE',
      })
    })

    it('Test for consecutive concurrent calculation with other validation', async () => {
      fakeApi.post(`/validation/${prisonerId}/full-validation`).reply(200, [
        {
          code: 'CONCURRENT_CONSECUTIVE_SENTENCES_DURATION',
          message: '10 years 9 months 8 weeks 7 days',
          type: 'CONCURRENT_CONSECUTIVE',
        } as ValidationMessage,
        {
          code: 'OFFENCE_MISSING_DATE',
          message: 'The validation failed',
          type: 'VALIDATION',
        } as ValidationMessage,
      ])

      const result = await calculateReleaseDatesService.validateBackend(prisonerId, null, token)

      expect(result).toEqual({
        messages: [{ text: 'The validation failed' }],
        messageType: 'VALIDATION',
      })
    })

    it('Gets calculation history', async () => {
      const history = [
        {
          offenderNo: 'GU32342',
          calculationDate: '2024-03-05',
          calculationSource: 'NOMIS',
          commentText: 'a calculation',
          calculationType: 'CALCULATED',
          establishment: 'Kirkham (HMP)',
          calculationRequestId: 90328,
          calculationReason: 'New Sentence',
        },
      ]
      fakeApi.get(`/historicCalculations/${prisonerId}`).reply(200, history)

      const result = await calculateReleaseDatesService.getCalculationHistory(prisonerId, null)
      expect(result).toEqual(history)
    })
  })

  describe('Latest calc card', () => {
    it('Should get latest calc without print notification slip', async () => {
      const latestCalc: LatestCalculation = {
        prisonerId,
        bookingId: 123456,
        calculationRequestId: 654321,
        reason: 'Initial check',
        calculatedAt: '2025-02-01T10:30:00',
        source: 'CRDS',
        establishment: 'Kirkham (HMP)',
        dates: [
          { date: '2024-02-21', type: 'CRD', description: 'Conditional release date', hints: [] },
          { date: '2024-06-15', type: 'SLED', description: 'Sentence and licence expiry date', hints: [] },
        ],
      }
      const latestCalcCard: LatestCalculationCardConfig = {
        reason: 'Initial check',
        calculatedAt: '2025-02-01T10:30:00',
        source: 'CRDS',
        establishment: 'Kirkham (HMP)',
        dates: [
          { date: '2024-02-21', type: 'CRD', description: 'Conditional release date', hints: [] },
          { date: '2024-06-15', type: 'SLED', description: 'Sentence and licence expiry date', hints: [] },
        ],
      }
      const latestCalcCardAction: Action = {
        title: 'View details',
        href: '/view/A1234AB/sentences-and-offences/654321',
        dataQa: 'latest-calc-card-action',
      }
      fakeApi.get(`/calculation/${prisonerId}/latest`).reply(200, latestCalc)
      const result = await calculateReleaseDatesService.getLatestCalculationCardForPrisoner(prisonerId, null, true)
      expect(result).toStrictEqual({
        latestCalcCard,
        latestCalcCardAction,
      })
    })
    it('Should get latest calc and map to a card and action', async () => {
      const latestCalc: LatestCalculation = {
        prisonerId,
        bookingId: 123456,
        calculationRequestId: 654321,
        reason: 'Initial check',
        calculatedAt: '2025-02-01T10:30:00',
        source: 'CRDS',
        establishment: 'Kirkham (HMP)',
        dates: [
          { date: '2024-02-21', type: 'CRD', description: 'Conditional release date', hints: [] },
          { date: '2024-06-15', type: 'SLED', description: 'Sentence and licence expiry date', hints: [] },
        ],
      }
      const latestCalcCard: LatestCalculationCardConfig = {
        reason: 'Initial check',
        calculatedAt: '2025-02-01T10:30:00',
        source: 'CRDS',
        establishment: 'Kirkham (HMP)',
        dates: [
          { date: '2024-02-21', type: 'CRD', description: 'Conditional release date', hints: [] },
          { date: '2024-06-15', type: 'SLED', description: 'Sentence and licence expiry date', hints: [] },
        ],
        printNotificationSlip: {
          dataQa: 'release-notification-hook',
          href: `/view/${prisonerId}/calculation-summary/${latestCalc.calculationRequestId}/printNotificationSlip?fromPage=view`,
        },
      }
      const latestCalcCardAction: Action = {
        title: 'View details',
        href: '/view/A1234AB/sentences-and-offences/654321',
        dataQa: 'latest-calc-card-action',
      }
      fakeApi.get(`/calculation/${prisonerId}/latest`).reply(200, latestCalc)
      const result = await calculateReleaseDatesService.getLatestCalculationCardForPrisoner(prisonerId, null, false)
      expect(result).toStrictEqual({
        latestCalcCard,
        latestCalcCardAction,
      })
    })
    it('Should have print notification slip link', async () => {
      const latestCalc: LatestCalculation = {
        prisonerId,
        bookingId: 123456,
        calculationRequestId: 654321,
        reason: 'Initial check',
        calculatedAt: '2025-02-01T10:30:00',
        source: 'CRDS',
        establishment: 'Kirkham (HMP)',
        dates: [
          { date: '2024-02-21', type: 'CRD', description: 'Conditional release date', hints: [] },
          { date: '2024-06-15', type: 'SLED', description: 'Sentence and licence expiry date', hints: [] },
        ],
      }
      const latestCalcCard: LatestCalculationCardConfig = {
        reason: 'Initial check',
        calculatedAt: '2025-02-01T10:30:00',
        source: 'CRDS',
        establishment: 'Kirkham (HMP)',
        dates: [
          { date: '2024-02-21', type: 'CRD', description: 'Conditional release date', hints: [] },
          { date: '2024-06-15', type: 'SLED', description: 'Sentence and licence expiry date', hints: [] },
        ],
        printNotificationSlip: {
          dataQa: 'release-notification-hook',
          href: `/view/${prisonerId}/calculation-summary/${latestCalc.calculationRequestId}/printNotificationSlip?fromPage=view`,
        },
      }
      const latestCalcCardAction: Action = {
        title: 'View details',
        href: '/view/A1234AB/sentences-and-offences/654321',
        dataQa: 'latest-calc-card-action',
      }
      fakeApi.get(`/calculation/${prisonerId}/latest`).reply(200, latestCalc)
      const result = await calculateReleaseDatesService.getLatestCalculationCardForPrisoner(prisonerId, null, false)
      expect(result).toStrictEqual({
        latestCalcCard,
        latestCalcCardAction,
      })
    })
    it('Should get latest calc and map to a card but no action if calc reference missing', async () => {
      const latestCalc: LatestCalculation = {
        prisonerId,
        bookingId: 123456,
        reason: 'Initial check',
        calculatedAt: '2025-02-01T10:30:00',
        source: 'CRDS',
        establishment: 'Kirkham (HMP)',
        dates: [
          { date: '2024-02-21', type: 'CRD', description: 'Conditional release date', hints: [] },
          { date: '2024-06-15', type: 'SLED', description: 'Sentence and licence expiry date', hints: [] },
        ],
      }
      const latestCalcCard: LatestCalculationCardConfig = {
        reason: 'Initial check',
        calculatedAt: '2025-02-01T10:30:00',
        source: 'CRDS',
        establishment: 'Kirkham (HMP)',
        dates: [
          { date: '2024-02-21', type: 'CRD', description: 'Conditional release date', hints: [] },
          { date: '2024-06-15', type: 'SLED', description: 'Sentence and licence expiry date', hints: [] },
        ],
      }
      fakeApi.get(`/calculation/${prisonerId}/latest`).reply(200, latestCalc)
      const result = await calculateReleaseDatesService.getLatestCalculationCardForPrisoner(prisonerId, null, false)
      expect(result).toStrictEqual({
        latestCalcCard,
        latestCalcCardAction: undefined,
      })
    })
    it('Should return undefined card and action if no prisoner or calc found', async () => {
      fakeApi.get(`/calculation/${prisonerId}/latest`).reply(404)
      const result = await calculateReleaseDatesService.getLatestCalculationCardForPrisoner(prisonerId, null, false)
      expect(result).toStrictEqual({
        latestCalcCard: undefined,
        latestCalcCardAction: undefined,
      })
    })
    it('Should return undefined card and action if error occurs', async () => {
      fakeApi.get(`/calculation/${prisonerId}/latest`).reply(422, { userMessage: 'Generic error message' })
      const result = await calculateReleaseDatesService.getLatestCalculationCardForPrisoner(prisonerId, null, false)
      expect(result).toStrictEqual({
        latestCalcCard: undefined,
        latestCalcCardAction: undefined,
      })
    })
    it('Should return Error object if no Nomis offence dates are present', async () => {
      fakeApi
        .get(`/calculation/${prisonerId}/latest`)
        .reply(422, { userMessage: 'no offence end or start dates provided on charge 123' })
      const result = await calculateReleaseDatesService.getLatestCalculationCardForPrisoner(prisonerId, null, false)
      expect(result).toStrictEqual(FullPageError.noOffenceDatesPage())
    })
    it('Should return Error object if no Nomis sentence terms are present', async () => {
      fakeApi.get(`/calculation/${prisonerId}/latest`).reply(422, { userMessage: 'missing imprisonment_term_code 123' })
      const result = await calculateReleaseDatesService.getLatestCalculationCardForPrisoner(prisonerId, null, false)
      expect(result).toStrictEqual(FullPageError.noImprisonmentTermPage())
    })
    it('Should return Error object if no Nomis licence terms are present', async () => {
      fakeApi.get(`/calculation/${prisonerId}/latest`).reply(422, { userMessage: 'missing licence_term_code 123' })
      const result = await calculateReleaseDatesService.getLatestCalculationCardForPrisoner(prisonerId, null, false)
      expect(result).toStrictEqual(FullPageError.noLicenceTermPage())
    })
  })
  describe('get detailed calculation results with adjustments', () => {
    const detailedCalcResultsWithNoBreakdown: DetailedCalculationResults = {
      context: {
        calculationRequestId,
        prisonerId,
        bookingId: 654321,
        calculationDate: '2024-01-01',
        calculationStatus: 'CONFIRMED',
        calculationReference: 'UUID',
        calculationType: 'CALCULATED',
        calculationReason: { id: 1, isOther: true, displayName: 'Other', useForApprovedDates: false },
        otherReasonDescription: 'Test',
        usePreviouslyRecordedSLEDIfFound: false,
      },
      dates: {
        CRD: {
          date: '2021-02-03',
          type: 'CRD',
          description: 'Conditional release date',
          hints: [{ text: 'Tuesday, 02 February 2021 when adjusted to a working day' }],
        },
        SED: { date: '2021-02-03', type: 'SED', description: 'Sentence expiry date', hints: [] },
        HDCED: {
          date: '2021-10-03',
          type: 'HDCED',
          description: 'Home detention curfew eligibility date',
          hints: [{ text: 'Tuesday, 05 October 2021 when adjusted to a working day' }],
        },
        ERSED: { date: '2020-02-03', type: 'ERSED', description: 'Early removal scheme eligibility date', hints: [] },
      },
      calculationOriginalData: {
        prisonerDetails: {
          firstName: 'Joe',
          lastName: 'Bloggs',
          bookingId: 654321,
          agencyId: 'ABC',
          offenderNo: prisonerId,
          dateOfBirth: '2000-01-01',
          assignedLivingUnit: {
            agencyId: 'ABC',
            agencyName: 'HMP ABC',
            description: 'Some desc',
            locationId: 999,
          },
          alerts: [],
        },
        sentencesAndOffences: [
          {
            bookingId: 1,
            sentenceStatus: '',
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
            sentenceSequence: 1,
            offence: {
              offenderChargeId: 1,
              offenceEndDate: '2021-02-03',
              offenceCode: '123',
              offenceDescription: '',
              indicators: [],
            },
            isSDSPlus: false,
            hasAnSDSEarlyReleaseExclusion: 'NO',
            isSDSPlusEligibleSentenceTypeLengthAndOffence: false,
            isSDSPlusOffenceInPeriod: false,
            revocationDates: [],
          },
          {
            bookingId: 1,
            sentenceStatus: '',
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
            sentenceSequence: 1,
            offence: {
              offenderChargeId: 2,
              offenceStartDate: '2021-01-04',
              offenceEndDate: '2021-01-05',
              offenceCode: '123',
              offenceDescription: '',
              indicators: [],
            },
            isSDSPlus: false,
            hasAnSDSEarlyReleaseExclusion: 'NO',
            isSDSPlusEligibleSentenceTypeLengthAndOffence: false,
            isSDSPlusOffenceInPeriod: false,
            revocationDates: [],
          },
          {
            bookingId: 1,
            sentenceStatus: '',
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
            sentenceSequence: 1,
            offence: {
              offenderChargeId: 3,
              offenceStartDate: '2021-03-06',
              offenceCode: '123',
              offenceDescription: '',
              indicators: [],
            },
            isSDSPlus: false,
            hasAnSDSEarlyReleaseExclusion: 'NO',
            isSDSPlusEligibleSentenceTypeLengthAndOffence: false,
            isSDSPlusOffenceInPeriod: false,
            revocationDates: [],
          },
          {
            bookingId: 1,
            sentenceStatus: '',
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
            sentenceSequence: 1,
            offence: {
              offenderChargeId: 4,
              offenceStartDate: '2021-01-07',
              offenceEndDate: '2021-01-07',
              offenceCode: '123',
              offenceDescription: '',
              indicators: [],
            },
            isSDSPlus: false,
            hasAnSDSEarlyReleaseExclusion: 'NO',
            isSDSPlusEligibleSentenceTypeLengthAndOffence: false,
            isSDSPlusOffenceInPeriod: false,
            revocationDates: [],
          },
          {
            bookingId: 1,
            sentenceStatus: '',
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
            caseSequence: 2,
            lineSequence: 2,
            sentenceSequence: 2,
            consecutiveToSequence: 1,
            sentenceCalculationType: 'ADIMP',
            sentenceTypeDescription: 'SDS Standard Sentence',
            offence: {
              offenderChargeId: 5,
              offenceEndDate: '2021-02-03',
              offenceCode: '123',
              offenceDescription: '',
              indicators: [],
            },
            isSDSPlus: false,
            hasAnSDSEarlyReleaseExclusion: 'NO',
            isSDSPlusEligibleSentenceTypeLengthAndOffence: false,
            isSDSPlusOffenceInPeriod: false,
            revocationDates: [],
          },
        ],
      },
      approvedDates: {},
      breakdownMissingReason: 'UNSUPPORTED_CALCULATION_BREAKDOWN',
    }

    it('can get with breakdown missing safely', async () => {
      fakeApi
        .get(`/calculation/detailed-results/${calculationRequestId}`)
        .reply(200, detailedCalcResultsWithNoBreakdown)
      const result = await calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments(
        calculationRequestId,
        null,
      )
      return expect(result).toStrictEqual({
        ...detailedCalcResultsWithNoBreakdown,
        releaseDatesWithAdjustments: undefined,
      })
    })
    it('can get with breakdown and adjustments', async () => {
      const detailedResultsWithABreakdown: DetailedCalculationResults = {
        ...detailedCalcResultsWithNoBreakdown,
        calculationBreakdown: psiExample25CalculationBreakdown(),
      }
      fakeApi.get(`/calculation/detailed-results/${calculationRequestId}`).reply(200, detailedResultsWithABreakdown)
      const result = await calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments(
        calculationRequestId,
        null,
      )
      return expect(result).toStrictEqual({
        ...detailedResultsWithABreakdown,
        releaseDatesWithAdjustments: [
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
            hintText: '16 February 2015 plus 61 days minus 21 days',
            releaseDate: '2015-03-28',
            releaseDateType: 'HDCED',
          },
          {
            hintText: '16 June 2015 plus 12 months minus 21 days',
            releaseDate: '2016-05-26',
            releaseDateType: 'TUSED',
          },
        ],
      })
    })
    it('can get with breakdown and adjustments when there are adjustments that we do not display', async () => {
      const detailedResultsWithABreakdown: DetailedCalculationResults = {
        ...detailedCalcResultsWithNoBreakdown,
        calculationBreakdown: {
          concurrentSentences: [],
          consecutiveSentence: {
            sentencedAt: '2015-02-22',
            sentenceLength: '10 months',
            sentenceLengthDays: 303,
            dates: {
              SED: { unadjusted: '2015-12-21', adjusted: '2015-12-21', daysFromSentenceStart: 303, adjustedByDays: 0 },
              CRD: { unadjusted: '2015-07-23', adjusted: '2015-07-23', daysFromSentenceStart: 152, adjustedByDays: 0 },
            },
            sentenceParts: [
              {
                lineSequence: 1,
                caseSequence: 1,
                sentenceLength: '3 months',
                sentenceLengthDays: 89,
                consecutiveToLineSequence: null,
                consecutiveToCaseSequence: null,
                externalSentenceId: {
                  sentenceSequence: 0,
                  bookingId: 0,
                },
              },
              {
                lineSequence: 2,
                caseSequence: 1,
                sentenceLength: '7 months',
                sentenceLengthDays: 212,
                consecutiveToLineSequence: 1,
                consecutiveToCaseSequence: 1,
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
              adjustedDays: 0,
              releaseDate: '2015-07-23',
              unadjustedDate: '2015-07-23',
            },
            HDCED: {
              // this rule isn't displayed so there should be no adjustment row for it
              rules: ['HDCED_ADJUSTED_TO_CONCURRENT_CONDITIONAL_RELEASE'],
              rulesWithExtraAdjustments: {},
              adjustedDays: -13,
              releaseDate: '2024-05-05',
              unadjustedDate: '2024-04-22',
            },
          },
          otherDates: {},
          ersedNotApplicableDueToDtoLaterThanCrd: false,
          showSds40Hints: false,
        },
      }
      fakeApi.get(`/calculation/detailed-results/${calculationRequestId}`).reply(200, detailedResultsWithABreakdown)
      const result = await calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments(
        calculationRequestId,
        null,
      )
      return expect(result).toStrictEqual({
        ...detailedResultsWithABreakdown,
        releaseDatesWithAdjustments: [
          {
            hintText: '23 July 2015 plus 0 days',
            releaseDate: '2015-07-23',
            releaseDateType: 'CRD',
          },
        ],
      })
    })
  })

  it('creating a genuine override successfully audits it', async () => {
    const response: GenuineOverrideCreatedResponse = {
      success: true,
      newCalculationRequestId: 564658897564,
      originalCalculationRequestId: calculationRequestId,
    }
    auditService.publishGenuineOverride.mockResolvedValue()
    fakeApi.post(`/genuine-override/calculation/${calculationRequestId}`).reply(200, response)

    const result = await calculateReleaseDatesService.createGenuineOverrideForCalculation(
      userName,
      nomsId,
      calculationRequestId,
      token,
      {
        dates: [],
        reason: 'OTHER',
        reasonFurtherDetail: 'Foo',
      },
    )

    expect(result).toEqual(response)
    expect(auditService.publishGenuineOverride).toHaveBeenCalledWith(
      'USERNAME',
      'A1234AB',
      calculationRequestId,
      564658897564,
    )
  })

  it('creating a genuine override fails with validation error is not audited but we return the validation messages', async () => {
    auditService.publishGenuineOverrideFailed.mockResolvedValue()
    const response: GenuineOverrideCreatedResponse = {
      success: false,
      validationMessages: [
        { code: 'DATES_MISSING_REQUIRED_TYPE', message: 'Error 1', type: 'VALIDATION', arguments: [] },
        { code: 'DATES_PAIRINGS_INVALID', message: 'Error 2', type: 'VALIDATION', arguments: [] },
      ],
    }
    fakeApi.post(`/genuine-override/calculation/${calculationRequestId}`).reply(400, response)

    const result = await calculateReleaseDatesService.createGenuineOverrideForCalculation(
      userName,
      nomsId,
      calculationRequestId,
      token,
      {
        dates: [],
        reason: 'OTHER',
        reasonFurtherDetail: 'Foo',
      },
    )
    expect(result).toEqual(response)
    expect(auditService.publishGenuineOverride).not.toHaveBeenCalled()
    expect(auditService.publishGenuineOverrideFailed).not.toHaveBeenCalled()
  })

  it('creating a genuine override fails with unknown error is audited', async () => {
    auditService.publishGenuineOverrideFailed.mockResolvedValue()
    fakeApi.post(`/genuine-override/calculation/${calculationRequestId}`).reply(500)

    try {
      await calculateReleaseDatesService.createGenuineOverrideForCalculation(
        userName,
        nomsId,
        calculationRequestId,
        token,
        {
          dates: [],
          reason: 'OTHER',
          reasonFurtherDetail: 'Foo',
        },
      )
      fail('Should have blown up')
    } catch (error) {
      expect(auditService.publishGenuineOverrideFailed).toHaveBeenCalledWith(
        'USERNAME',
        'A1234AB',
        calculationRequestId,
        error,
      )
    }
  })
})

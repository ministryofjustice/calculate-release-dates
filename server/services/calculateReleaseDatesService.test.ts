import nock from 'nock'
import CalculateReleaseDatesService from './calculateReleaseDatesService'
import HmppsAuthClient from '../api/hmppsAuthClient'
import config from '../config'
import {
  BookingCalculation,
  CalculationBreakdown,
  WorkingDay,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

jest.mock('../api/hmppsAuthClient')

const prisonerId = 'A1234AB'
const calculationRequestId = 123456
const calculationResults: BookingCalculation = {
  dates: {
    CRD: '2021-02-03',
    SLED: '2021-10-28',
    HDCED: '2021-10-10',
  },
  calculationRequestId,
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
}
const token = 'token'

describe('User service', () => {
  let hmppsAuthClient: jest.Mocked<HmppsAuthClient>
  let calculateReleaseDatesService: CalculateReleaseDatesService
  let fakeApi: nock.Scope
  beforeEach(() => {
    config.apis.calculateReleaseDates.url = 'http://localhost:8100'
    fakeApi = nock(config.apis.calculateReleaseDates.url)
    hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
    calculateReleaseDatesService = new CalculateReleaseDatesService(hmppsAuthClient)
  })
  afterEach(() => {
    nock.cleanAll()
  })

  describe('calculatePreliminaryReleaseDates', () => {
    it('Test the running of a preliminary calculation of release dates', async () => {
      fakeApi.post(`/calculation/${prisonerId}`).reply(200, calculationResults)

      const result = await calculateReleaseDatesService.calculatePreliminaryReleaseDates('user', prisonerId, token)

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
      token
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

  it('Test getting calculation breakdown', async () => {
    fakeApi.get(`/calculation/breakdown/${calculationRequestId}`).reply(200, calculationBreakdown)

    const result = await calculateReleaseDatesService.getCalculationBreakdown('user', calculationRequestId, token)

    expect(result).toEqual(calculationBreakdown)
  })

  it('Test getting effective dates', async () => {
    const result = calculateReleaseDatesService.getEffectiveDates(calculationResults, calculationBreakdown)

    expect(result).toEqual({
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
    })
  })
})

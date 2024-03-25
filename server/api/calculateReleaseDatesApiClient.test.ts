import nock from 'nock'
import config from '../config'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import CalculateReleaseDatesApiClient from './calculateReleaseDatesApiClient'

jest.mock('../data/hmppsAuthClient')

interface TestData {
  key: string
  value: string
}

const calculateReleaseDatesService = new CalculateReleaseDatesService()
const stubbedTestData: TestData[] = [{ key: 'X', value: 'Y' } as TestData]
const token = 'token'

describe('Calculate release dates API client tests', () => {
  let fakeApi: nock.Scope
  const calculationRequestId = 123456
  const prisonerId = 'ABC123'

  beforeEach(() => {
    config.apis.calculateReleaseDates.url = 'http://localhost:8100'
    fakeApi = nock(config.apis.calculateReleaseDates.url)
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('Tests for API calls', () => {
    it('Get calculation results data', async () => {
      fakeApi.get(`/calculation/results/${calculationRequestId}`, '').reply(200, stubbedTestData)
      const data = await calculateReleaseDatesService.getCalculationResults(calculationRequestId, token)
      expect(data).toEqual(stubbedTestData)
      expect(nock.isDone()).toBe(true)
    })

    it('Empty data', async () => {
      fakeApi.get(`/calculation/results/${calculationRequestId}`, '').reply(200, [])
      const data = await calculateReleaseDatesService.getCalculationResults(123456, token)
      expect(data).toEqual([])
      expect(nock.isDone()).toBe(true)
    })

    it('Get detailed calculation results', async () => {
      fakeApi.get(`/calculation/detailed-results/${calculationRequestId}`, '').reply(200, stubbedTestData)
      const client = new CalculateReleaseDatesApiClient(token)
      const data = await client.getDetailedCalculationResults(calculationRequestId)
      expect(data).toEqual(stubbedTestData)
      expect(nock.isDone()).toBe(true)
    })

    describe('Get latest calculation for prisoner', () => {
      it('Get latest calculation for prisoner successfully', async () => {
        fakeApi.get(`/calculation/${prisonerId}/latest`, '').reply(200, stubbedTestData)
        const data = await new CalculateReleaseDatesApiClient(token).getLatestCalculationForPrisoner(prisonerId)
        expect(data).toEqual(stubbedTestData)
        expect(nock.isDone()).toBe(true)
      })
      it('Get latest calculation for prisoner fails with 404 and throws Error', async () => {
        fakeApi.get(`/calculation/${prisonerId}/latest`, '').reply(404)
        const client = new CalculateReleaseDatesApiClient(token)
        await expect(client.getLatestCalculationForPrisoner(prisonerId)).rejects.toThrow('Not Found')
      })
    })
  })
})

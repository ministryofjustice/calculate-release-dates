import nock from 'nock'
import config from '../config'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'

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
      const data = await calculateReleaseDatesService.getCalculationResults('XTEST1', calculationRequestId, token)
      expect(data).toEqual(stubbedTestData)
      expect(nock.isDone()).toBe(true)
    })

    it('Empty data', async () => {
      fakeApi.get(`/calculation/results/${calculationRequestId}`, '').reply(200, [])
      const data = await calculateReleaseDatesService.getCalculationResults('XTEST1', 123456, token)
      expect(data).toEqual([])
      expect(nock.isDone()).toBe(true)
    })
  })
})

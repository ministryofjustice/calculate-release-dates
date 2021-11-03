import nock from 'nock'
import config from '../config'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import HmppsAuthClient from './hmppsAuthClient'

jest.mock('./hmppsAuthClient')

interface TestData {
  key: string
  value: string
}

const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
const calculateReleaseDatesService = new CalculateReleaseDatesService(hmppsAuthClient)
const stubbedTestData: TestData[] = [{ key: 'X', value: 'Y' } as TestData]

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

  it('Get calculation results data', async () => {
    hmppsAuthClient.getSystemClientToken.mockResolvedValue('a token')
    fakeApi.get(`/calculation/results/${calculationRequestId}`, '').reply(200, stubbedTestData)
    const data = await calculateReleaseDatesService.getCalculationResults('XTEST1', calculationRequestId)
    expect(data).toEqual(stubbedTestData)
    expect(nock.isDone()).toBe(true)
    expect(hmppsAuthClient.getSystemClientToken).toBeCalled()
  })

  it('No client token', async () => {
    hmppsAuthClient.getSystemClientToken.mockResolvedValue('')
    fakeApi.get(`/calculation/results/${calculationRequestId}`, '').reply(401)
    try {
      await calculateReleaseDatesService.getCalculationResults('XTEST1', 123456)
    } catch (e) {
      expect(e.message).toContain('Unauthorized')
    }
    expect(nock.isDone()).toBe(true)
    expect(hmppsAuthClient.getSystemClientToken).toBeCalled()
  })

  it('Empty data', async () => {
    hmppsAuthClient.getSystemClientToken.mockResolvedValue('a token')
    fakeApi.get(`/calculation/results/${calculationRequestId}`, '').reply(200, [])
    const data = await calculateReleaseDatesService.getCalculationResults('XTEST1', 123456)
    expect(data).toEqual([])
    expect(nock.isDone()).toBe(true)
    expect(hmppsAuthClient.getSystemClientToken).toBeCalled()
  })
})

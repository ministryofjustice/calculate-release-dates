import nock from 'nock'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import AuditService from '../services/auditService'
import CalculateReleaseDatesApiRestClient from './calculateReleaseDatesApiRestClient'

jest.mock('../services/auditService')

interface TestData {
  key: string
  value: string
}

const auditService = new AuditService() as jest.Mocked<AuditService>
const mockAuthenticationClient: AuthenticationClient = {
  getToken: jest.fn().mockResolvedValue('test-system-token'),
} as unknown as jest.Mocked<AuthenticationClient>
const calculateReleaseDatesApiRestClient = new CalculateReleaseDatesApiRestClient(mockAuthenticationClient)
const calculateReleaseDatesService = new CalculateReleaseDatesService(
  auditService,
  calculateReleaseDatesApiRestClient,
) as jest.Mocked<CalculateReleaseDatesService>
const stubbedTestData: TestData[] = [{ key: 'X', value: 'Y' } as TestData]
const nomisCalculationSummary = { reason: 'Adjust Sentence', calculatedAt: '2024-04-18T10:47:39' }
const token = 'token'

describe('Calculate release dates API client tests', () => {
  let fakeApi: nock.Scope
  const calculationRequestId = 123456
  const prisonerId = 'ABC123'
  const offenderSentCalcId = 123456

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
      const data = await calculateReleaseDatesApiRestClient.getDetailedCalculationResults(calculationRequestId, 'user1')
      expect(data).toEqual(stubbedTestData)
      expect(nock.isDone()).toBe(true)
    })

    describe('Get nomis calculation summary for prisoner', () => {
      it('Get nomis calculation summary for offenderSentCalcId fails with 404 and throws Error', async () => {
        fakeApi.get(`/calculation/nomis-calculation-summary/${offenderSentCalcId}`, '').reply(404)
        await expect(
          calculateReleaseDatesApiRestClient.getNomisCalculationSummary(offenderSentCalcId, 'user1'),
        ).rejects.toThrow('Not Found')
      })

      it('Get nomis calculation summary for offenderSentCalcId successfully', async () => {
        fakeApi
          .get(`/calculation/nomis-calculation-summary/${offenderSentCalcId}`, '')
          .reply(200, nomisCalculationSummary)
        const data = await calculateReleaseDatesApiRestClient.getNomisCalculationSummary(offenderSentCalcId, 'user1')
        expect(data).toEqual(nomisCalculationSummary)
        expect(nock.isDone()).toBe(true)
      })
    })

    describe('Get latest calculation for prisoner', () => {
      it('Get latest calculation for prisoner successfully', async () => {
        fakeApi.get(`/calculation/${prisonerId}/latest`, '').reply(200, stubbedTestData)
        const data = await calculateReleaseDatesApiRestClient.getLatestCalculationForPrisoner(prisonerId, 'user1')
        expect(data).toEqual(stubbedTestData)
        expect(nock.isDone()).toBe(true)
      })
      it('Get latest calculation for prisoner fails with 404 and throws Error', async () => {
        fakeApi.get(`/calculation/${prisonerId}/latest`, '').reply(404)
        await expect(calculateReleaseDatesService.getLatestCalculationForPrisoner(prisonerId, 'user1')).rejects.toThrow(
          'Not Found',
        )
      })
    })
    describe('Get reference data', () => {
      it('Get date types and descriptions', async () => {
        const dates = [
          { type: 'FOO', description: 'Foo date' },
          { type: 'BAR', description: 'Bar date' },
        ]
        fakeApi.get('/reference-data/date-type', '').reply(200, dates)
        const data = await calculateReleaseDatesApiRestClient.getDateTypeDefinitions('user1')
        expect(data).toEqual(dates)
        expect(nock.isDone()).toBe(true)
      })
    })
  })
})

import nock from 'nock'
import CalculateReleaseDatesService from './calculateReleaseDatesService'
import HmppsAuthClient from '../api/hmppsAuthClient'
import config from '../config'

jest.mock('../api/hmppsAuthClient')

const prisonerId = 'A1234AB'

describe('User service', () => {
  let hmppsAuthClient: jest.Mocked<HmppsAuthClient>
  let calculateReleaseDatesService: CalculateReleaseDatesService
  let fakeApi: nock.Scope

  describe('calculatePreliminaryReleaseDates', () => {
    beforeEach(() => {
      config.apis.calculateReleaseDates.url = 'http://localhost:8100'
      fakeApi = nock(config.apis.calculateReleaseDates.url)
      hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
      calculateReleaseDatesService = new CalculateReleaseDatesService(hmppsAuthClient)
    })
    afterEach(() => {
      nock.cleanAll()
    })
    it('Test the running of a preliminary calculation of release dates', async () => {
      const calculationResults = {
        dates: {
          CRD: '2021-02-03',
        },
      }
      fakeApi.post(`/calculation/${prisonerId}`).reply(200, calculationResults)

      const result = await calculateReleaseDatesService.calculatePreliminaryReleaseDates('user', prisonerId)

      expect(result).toEqual(calculationResults)
    })
  })
})

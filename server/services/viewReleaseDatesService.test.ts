import nock from 'nock'
import config from '../config'
import {
  CalculationSentenceUserInput,
  CalculationUserInputs,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ViewReleaseDatesService from './viewReleaseDatesService'

jest.mock('../api/hmppsAuthClient')

const token = 'token'
const stubbedUserInput = {
  sentenceCalculationUserInputs: [
    {
      userInputType: 'ORIGINAL',
      userChoice: true,
      offenceCode: '123',
      sentenceSequence: 2,
    } as CalculationSentenceUserInput,
  ],
} as CalculationUserInputs
describe('View release dates service tests', () => {
  let viewReleaseDatesService: ViewReleaseDatesService
  let fakeApi: nock.Scope
  beforeEach(() => {
    config.apis.calculateReleaseDates.url = 'http://localhost:8100'
    fakeApi = nock(config.apis.calculateReleaseDates.url)
    viewReleaseDatesService = new ViewReleaseDatesService()
  })
  afterEach(() => {
    nock.cleanAll()
  })

  describe('calculatePreliminaryReleaseDates', () => {
    it('Test the request for user inputs from a calculation', async () => {
      const calculationId = 123
      fakeApi.get(`/calculation/calculation-user-input/${calculationId}`).reply(200, stubbedUserInput)

      const result = await viewReleaseDatesService.getCalculationUserInputs(calculationId, token)

      expect(result).toEqual(stubbedUserInput)
    })
    it('The service returns null if there were no user inputs to the calculation', async () => {
      const calculationId = 123
      fakeApi.get(`/calculation/calculation-user-input/${calculationId}`).reply(404)

      const result = await viewReleaseDatesService.getCalculationUserInputs(calculationId, token)

      expect(result).toEqual(null)
    })
  })
})

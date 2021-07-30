import nock from 'nock'
import config from '../config'
import PrisonerService from '../services/prisonerService'
import HmppsAuthClient from './hmppsAuthClient'
import { PrisonApiPrisoner, PrisonApiSentenceDetail } from './prisonClientTypes'

jest.mock('./hmppsAuthClient')

const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
const prisonerService = new PrisonerService(hmppsAuthClient)

const stubbedPrisonerData = {
  offenderNo: 'A1234AA',
  firstName: 'Ringo',
  lastName: 'Starr',
  latestLocationId: 'LEI',
  locationDescription: 'Inside - Leeds HMP',
  dateOfBirth: '24/06/2000',
  age: 21,
  activeFlag: true,
  legalStatus: 'REMAND',
  category: 'Cat C',
  imprisonmentStatus: 'LIFE',
  imprisonmentStatusDescription: 'Serving Life Imprisonment',
  religion: 'Christian',
  sentenceDetail: {
    sentenceStartDate: '12/12/2019',
    additionalDaysAwarded: 4,
    tariffDate: '12/12/2030',
    releaseDate: '12/12/2028',
    conditionalReleaseDate: '12/12/2025',
    confirmedReleaseDate: '12/12/2026',
    sentenceExpiryDate: '16/12/2030',
    licenceExpiryDate: '16/12/2030',
  } as PrisonApiSentenceDetail,
} as PrisonApiPrisoner

describe('Prison API client tests', () => {
  let fakeApi: nock.Scope

  beforeEach(() => {
    config.apis.prisonApi.url = 'http://localhost:8100'
    fakeApi = nock(config.apis.prisonApi.url)
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('Prisoner detail', () => {
    it('Get prisoner detail', async () => {
      hmppsAuthClient.getSystemClientToken.mockResolvedValue('a token')
      fakeApi.get('/api/offenders/AA1234A', '').reply(200, stubbedPrisonerData)
      const data = await prisonerService.getPrisonerDetail('XTEST1', 'AA1234A')
      expect(data).toEqual(stubbedPrisonerData)
      expect(nock.isDone()).toBe(true)
      expect(hmppsAuthClient.getSystemClientToken).toBeCalled()
    })

    it('No client token', async () => {
      hmppsAuthClient.getSystemClientToken.mockResolvedValue('')
      fakeApi.get('/api/offenders/AA1234A', '').reply(401)
      try {
        await prisonerService.getPrisonerDetail('XTEST1', 'AA1234A')
      } catch (e) {
        expect(e.message).toContain('Unauthorized')
      }
      expect(nock.isDone()).toBe(true)
      expect(hmppsAuthClient.getSystemClientToken).toBeCalled()
    })

    it('Not found', async () => {
      hmppsAuthClient.getSystemClientToken.mockResolvedValue('a token')
      fakeApi.get('/api/offenders/AA1234A', '').reply(404)
      try {
        await prisonerService.getPrisonerDetail('XTEST1', 'AA1234A')
      } catch (e) {
        expect(e.message).toContain('Not Found')
      }
      expect(nock.isDone()).toBe(true)
      expect(hmppsAuthClient.getSystemClientToken).toBeCalled()
    })
  })
})

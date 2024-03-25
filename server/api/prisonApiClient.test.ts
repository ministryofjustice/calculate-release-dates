import nock from 'nock'
import config from '../config'
import PrisonerService from '../services/prisonerService'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { PrisonApiPrisoner, PrisonApiSentenceDetail } from '../@types/prisonApi/prisonClientTypes'
import { FullPageErrorType } from '../types/FullPageError'

jest.mock('../data/hmppsAuthClient')

const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
const prisonerService = new PrisonerService(hmppsAuthClient)

const stubbedPrisonerData = {
  offenderNo: 'A1234AA',
  firstName: 'Anon',
  lastName: 'Nobody',
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
  agencyId: 'MDI',
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

const caseloads = ['MDI']
const token = 'token'

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
      fakeApi.get('/api/offenders/AA1234A', '').reply(200, stubbedPrisonerData)
      const data = await prisonerService.getPrisonerDetail('AA1234A', caseloads, token)
      expect(data).toEqual(stubbedPrisonerData)
      expect(nock.isDone()).toBe(true)
    })

    it('Not found', async () => {
      fakeApi.get('/api/offenders/AA1234A', '').reply(404)
      try {
        await prisonerService.getPrisonerDetail('AA1234A', caseloads, token)
      } catch (e) {
        expect(e.errorKey).toBe(FullPageErrorType.NOT_IN_CASELOAD)
        expect(e.status).toBe(404)
      }
      expect(nock.isDone()).toBe(true)
    })
  })
})

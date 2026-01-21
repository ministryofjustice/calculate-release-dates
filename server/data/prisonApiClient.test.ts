import nock from 'nock'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import PrisonerService from '../services/prisonerService'
import { PrisonApiPrisoner, PrisonApiSentenceDetail } from '../@types/prisonApi/prisonClientTypes'
import { FullPageErrorType } from '../types/FullPageError'
import PrisonApiClient from './prisonApiClient'

jest.mock('./hmppsAuthClient')

const mockAuthenticationClient: jest.Mocked<AuthenticationClient> = {
  getToken: jest.fn().mockResolvedValue('test-system-token'),
} as unknown as jest.Mocked<AuthenticationClient>

const prisonApiClient = new PrisonApiClient(mockAuthenticationClient)
const prisonerService = new PrisonerService(mockAuthenticationClient, prisonApiClient)

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
      const data = await prisonerService.getPrisonerDetail('AA1234A', caseloads, [])
      expect(data).toEqual(stubbedPrisonerData)
      expect(nock.isDone()).toBe(true)
    })

    it('Not found', async () => {
      fakeApi.get('/api/offenders/AA1234A', '').reply(404)
      try {
        await prisonerService.getPrisonerDetail('AA1234A', caseloads, [])
      } catch (e) {
        expect(e.errorKey).toBe(FullPageErrorType.NOT_IN_CASELOAD)
        expect(e.status).toBe(404)
      }
      expect(nock.isDone()).toBe(true)
    })
  })
})

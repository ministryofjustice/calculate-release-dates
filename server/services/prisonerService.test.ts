import nock from 'nock'
import HmppsAuthClient from '../data/hmppsAuthClient'
import config from '../config'
import PrisonerService from './prisonerService'
import {
  PrisonApiPrisoner,
  PrisonApiSentenceDetail,
  PrisonApiUserCaseloads,
} from '../@types/prisonApi/prisonClientTypes'
import { FullPageErrorType } from '../types/FullPageError'

jest.mock('../data/hmppsAuthClient')

const caseload = {
  caseLoadId: 'MDI',
} as PrisonApiUserCaseloads

const prisonerDetails = {
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

const token = 'token'

describe('Prisoner service related tests', () => {
  let hmppsAuthClient: jest.Mocked<HmppsAuthClient>
  let prisonerService: PrisonerService
  let fakeApi: nock.Scope

  beforeEach(() => {
    config.apis.prisonApi.url = 'http://localhost:8100'
    fakeApi = nock(config.apis.prisonApi.url)
    hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
    prisonerService = new PrisonerService(hmppsAuthClient)
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('prisonerService', () => {
    it('should fetch user caseloads', async () => {
      fakeApi.get(`/api/users/me/caseLoads`).reply(200, [caseload])

      const result = await prisonerService.getUsersCaseloads(token)

      expect(result).toEqual([caseload])
    })

    describe('getPrisonerDetail', () => {
      it('should return prisoner details when agencyId is in user caseloads', async () => {
        fakeApi.get(`/api/offenders/A1234AB`).reply(200, prisonerDetails)

        const result = await prisonerService.getPrisonerDetail('A1234AB', token, ['MDI'], [])

        expect(result).toEqual(prisonerDetails)
      })

      it('should throw NOT_IN_CASELOAD when agencyId not in derived caseloads', async () => {
        fakeApi.get(`/api/offenders/A1234AB`).reply(200, { ...prisonerDetails, agencyId: 'LEX' })

        await expect(prisonerService.getPrisonerDetail('A1234AB', token, ['MDI'], [])).rejects.toMatchObject({
          errorKey: FullPageErrorType.NOT_IN_CASELOAD,
          status: 404,
        })
      })

      it('should return prisoner details when agencyId is OUT and user has Released Prisoner Viewing role', async () => {
        fakeApi.get(`/api/offenders/A1234AB`).reply(200, { ...prisonerDetails, agencyId: 'OUT' })

        const result = await prisonerService.getPrisonerDetail('A1234AB', token, ['MDI'], ['INACTIVE_BOOKINGS'])

        expect(result.agencyId).toBe('OUT')
      })

      it('should throw NOT_IN_CASELOAD when agencyId is OUT and user lacks relevant role', async () => {
        fakeApi.get(`/api/offenders/A1234AB`).reply(200, { ...prisonerDetails, agencyId: 'OUT' })

        await expect(prisonerService.getPrisonerDetail('A1234AB', token, ['MDI'], [])).rejects.toMatchObject({
          errorKey: FullPageErrorType.NOT_IN_CASELOAD,
          status: 404,
        })
      })
    })
  })
})

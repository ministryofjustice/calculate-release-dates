import request from 'supertest'
import type { Express } from 'express'
import { appWithAllRoutes } from './testutils/appSetup'
import EntryPointService from '../services/entryPointService'
import PrisonerService from '../services/prisonerService'
import { PrisonApiPrisoner, PrisonApiSentenceDetail } from '../@types/prisonApi/prisonClientTypes'

jest.mock('../services/entryPointService')
jest.mock('../services/prisonerService')

const entryPointService = new EntryPointService() as jest.Mocked<EntryPointService>
const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
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

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({ entryPointService, prisonerService })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Start routes tests', () => {
  it('GET / should return start page in standalone journey', () => {
    return request(app)
      .get('/')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Start')
        expect(res.text).toContain('href="/search/prisoners"')
        expect(res.text).not.toContain('A1234AA')
      })
      .expect(() => {
        expect(entryPointService.setStandaloneEntrypointCookie.mock.calls.length).toBe(1)
        expect(entryPointService.setDpsEntrypointCookie.mock.calls.length).toBe(0)
      })
  })
  it('GET ?prisonId=123 should return start page in DPS journey', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .get('?prisonId=123')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Start')
        expect(res.text).toContain('href="/calculation/123/pre-calculation-questions"')
        expect(res.text).toContain('A1234AA')
      })
      .expect(() => {
        expect(entryPointService.setDpsEntrypointCookie.mock.calls.length).toBe(1)
        expect(entryPointService.setStandaloneEntrypointCookie.mock.calls.length).toBe(0)
        expect(prisonerService.getPrisonerDetail).toBeCalledTimes(1)
      })
  })
  it('GET /supported-sentences should return the supported sentence page', () => {
    entryPointService.isDpsEntryPoint.mockReturnValue(false)
    return request(app)
      .get('/supported-sentences')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Supported sentences')
        expect(res.text).toContain('The sentences currently supported by the Calculates release dates service are:')
        expect(res.text).toContain('href="/"')
      })
      .expect(() => {
        expect(entryPointService.isDpsEntryPoint.mock.calls.length).toBe(1)
        expect(entryPointService.getDpsPrisonerId.mock.calls.length).toBe(0)
      })
  })
  it('GET /supported-sentences should return the supported sentence page from DPS', () => {
    entryPointService.isDpsEntryPoint.mockReturnValue(true)
    entryPointService.getDpsPrisonerId.mockReturnValue('ASD123')
    return request(app)
      .get('/supported-sentences')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Supported sentences')
        expect(res.text).toContain('The sentences currently supported by the Calculates release dates service are:')
        expect(res.text).toContain('href="/?prisonId=ASD123"')
      })
      .expect(() => {
        expect(entryPointService.isDpsEntryPoint.mock.calls.length).toBe(1)
        expect(entryPointService.getDpsPrisonerId.mock.calls.length).toBe(1)
      })
  })
})

import request from 'supertest'
import type { Express } from 'express'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import EntryPointService from '../services/entryPointService'
import PrisonerService from '../services/prisonerService'
import {
  PrisonAPIAssignedLivingUnit,
  PrisonApiPrisoner,
  PrisonApiSentenceDetail,
} from '../@types/prisonApi/prisonClientTypes'
import UserPermissionsService from '../services/userPermissionsService'
import {
  expectMiniProfile,
  expectNoMiniProfile,
  expectServiceHeader,
  expectServiceHeaderForPrisoner,
} from './testutils/layoutExpectations'
import config from '../config'

jest.mock('../services/entryPointService')
jest.mock('../services/prisonerService')
jest.mock('../services/userPermissionsService')

const entryPointService = new EntryPointService() as jest.Mocked<EntryPointService>
const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const userPermissionsService = new UserPermissionsService() as jest.Mocked<UserPermissionsService>
const stubbedPrisonerData = {
  offenderNo: 'A1234AA',
  firstName: 'Anon',
  lastName: 'Nobody',
  latestLocationId: 'LEI',
  locationDescription: 'Inside - Leeds HMP',
  dateOfBirth: '2000-06-24',
  age: 21,
  activeFlag: true,
  legalStatus: 'REMAND',
  category: 'Cat C',
  imprisonmentStatus: 'LIFE',
  imprisonmentStatusDescription: 'Serving Life Imprisonment',
  religion: 'Christian',
  agencyId: 'MDI',
  status: 'ACTIVE IN',
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
  assignedLivingUnit: {
    agencyName: 'Foo Prison (HMP)',
    description: 'D-2-003',
  } as PrisonAPIAssignedLivingUnit,
} as PrisonApiPrisoner

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: { entryPointService, prisonerService, userPermissionsService },
  })
})
afterEach(() => {
  jest.resetAllMocks()
  config.featureToggles.useCCARDLayout = false
})

describe('Start routes tests', () => {
  it('GET / should return start page in standalone journey', () => {
    return request(app)
      .get('/')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect(res.text).toContain('Calculate release dates')
        expect(res.text).toContain('href="/search/prisoners"')
        expect(res.text).not.toContain('A1234AA')
        expectNoMiniProfile(res.text)
        expect($('.govuk-phase-banner__content__tag').text()).toContain('beta')
      })
      .expect(() => {
        expect(entryPointService.setStandaloneEntrypointCookie.mock.calls.length).toBe(1)
        expect(entryPointService.setDpsEntrypointCookie.mock.calls.length).toBe(0)
      })
  })
  it('GET / should show service header with general link if CCARD layout is enabled', () => {
    config.featureToggles.useCCARDLayout = true
    return request(app)
      .get('/')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect(res.text).toContain('Calculate release dates')
        expect(res.text).toContain('href="/search/prisoners"')
        expect(res.text).not.toContain('A1234AA')
        expectNoMiniProfile(res.text)
        expectServiceHeader(res.text)
        expect($('.govuk-phase-banner__content__tag').length).toStrictEqual(0)
      })
      .expect(() => {
        expect(entryPointService.setStandaloneEntrypointCookie.mock.calls.length).toBe(1)
        expect(entryPointService.setDpsEntrypointCookie.mock.calls.length).toBe(0)
      })
  })
  it('GET ?prisonId=123 should return start page in DPS journey if CCARD feature toggle is off', () => {
    config.featureToggles.useCCARDLayout = false
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .get('?prisonId=123')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect(res.text).toContain('Calculate release dates')
        expect(res.text).toContain('href="/calculation/123/reason')
        expect(res.text).toContain('A1234AA')
        expectMiniProfile(res.text, {
          name: 'Anon Nobody',
          dob: '24 June 2000',
          prisonNumber: 'A1234AA',
          establishment: 'Foo Prison (HMP)',
          location: 'D-2-003',
        })
        expect($('.govuk-phase-banner__content__tag').text()).toContain('beta')
      })
      .expect(() => {
        expect(entryPointService.setDpsEntrypointCookie.mock.calls.length).toBe(1)
        expect(entryPointService.setStandaloneEntrypointCookie.mock.calls.length).toBe(0)
        expect(prisonerService.getPrisonerDetail).toBeCalledTimes(1)
      })
  })

  it('GET ?prisonId=123 should return start page in CCARD journey if CCARD feature toggle is on', () => {
    userPermissionsService.allowBulkLoad.mockReturnValue(true)
    config.featureToggles.useCCARDLayout = true

    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .get('?prisonId=123')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-qa=main-heading]').text()).toStrictEqual('Calculations and release dates')
        expectMiniProfile(res.text, {
          name: 'Nobody, Anon',
          dob: '24/06/2000',
          prisonNumber: 'A1234AA',
          establishment: 'Foo Prison (HMP)',
          location: 'D-2-003',
          status: 'Active in',
        })
        expectServiceHeaderForPrisoner(res.text, 'A1234AA')
        expect($('.govuk-phase-banner__content__tag').length).toStrictEqual(0)
        expect($('[data-qa=calc-release-dates-for-prisoner-action-link]').attr('href')).toStrictEqual(
          '/calculation/A1234AA/reason',
        )
        const links = $('.moj-sub-navigation__link')
          .filter((index, element) => $(element).attr('href').length > 0) // filter hidden links
          .map((i, element) => {
            return $(element).text()
          })
          .get()
        expect(links).toStrictEqual(['Overview', 'Court cases', 'Adjustments', 'Calculations and release dates'])
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
        expect(res.text).toContain(
          'The Calculate release dates service supports CJA (Criminal Justice Act) 2003 and 2020 sentences only. The sentences currently supported are:',
        )
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
        expect(res.text).toContain('href="/?prisonId=ASD123"')
      })
      .expect(() => {
        expect(entryPointService.isDpsEntryPoint.mock.calls.length).toBe(1)
        expect(entryPointService.getDpsPrisonerId.mock.calls.length).toBe(1)
      })
  })
  it('GET /supported-sentences/nomsid should return the supported sentence page from unsupported error', () => {
    entryPointService.isDpsEntryPoint.mockReturnValue(false)
    return request(app)
      .get('/supported-sentences/ASD123')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Supported sentences')
        expect(res.text).toContain('href="/calculation/ASD123/check-information?hasErrors=true')
      })
      .expect(() => {
        expect(entryPointService.isDpsEntryPoint.mock.calls.length).toBe(1)
      })
  })
})

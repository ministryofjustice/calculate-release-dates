import request from 'supertest'
import { Express } from 'express'
import nock from 'nock'
import { appWithAllRoutes } from './testutils/appSetup'
import UserPermissionsService from '../services/userPermissionsService'
import EntryPointService from '../services/entryPointService'
import PrisonerService from '../services/prisonerService'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import { BookingCalculation, GenuineOverride } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { PrisonApiPrisoner, PrisonApiSentenceDetail } from '../@types/prisonApi/prisonClientTypes'
import config from '../config'

let app: Express
let fakeApi: nock.Scope

jest.mock('../services/userPermissionsService')
jest.mock('../services/entryPointService')
jest.mock('../services/prisonerService')
jest.mock('../services/calculateReleaseDatesService')

const userPermissionsService = new UserPermissionsService() as jest.Mocked<UserPermissionsService>
const entryPointService = new EntryPointService() as jest.Mocked<EntryPointService>
const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const calculateReleaseDatesService = new CalculateReleaseDatesService() as jest.Mocked<CalculateReleaseDatesService>

const stubbedCalculationResults = {
  dates: {
    CRD: '2021-02-03',
    SED: '2021-02-03',
    HDCED: '2021-10-03',
    ERSED: '2020-02-03',
  },
  calculationRequestId: 123456,
  effectiveSentenceLength: {},
  prisonerId: 'A1234AB',
  calculationStatus: 'CONFIRMED',
  calculationReference: 'ABC123',
  bookingId: 123,
  approvedDates: {},
} as BookingCalculation

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
  agencyId: 'LEI',
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

beforeEach(() => {
  config.apis.calculateReleaseDates.url = 'http://localhost:8100'
  fakeApi = nock(config.apis.calculateReleaseDates.url)
  app = appWithAllRoutes({
    services: { userPermissionsService, entryPointService, calculateReleaseDatesService, prisonerService },
  })
})

afterEach(() => {
  nock.cleanAll()
  jest.resetAllMocks()
})

describe('Genuine overrides routes tests', () => {
  it('GET /specialist-support should return the Specialist Support index page', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    return request(app)
      .get('/specialist-support')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Specialist support team override tool')
      })
  })
  it('GET /specialist-support should return the not found page if does not have role', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(false)
    return request(app)
      .get('/specialist-support')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Not found')
      })
  })
  it('GET /specialist-support should return the Specialist Support index page with prisoner identity bar', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    calculateReleaseDatesService.getCalculationResultsByReference.mockResolvedValue(stubbedCalculationResults)
    prisonerService.getPrisonerDetailForSpecialistSupport.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .get('/specialist-support?calculationReference=123')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Specialist support team override tool')
        expect(res.text).toContain('Anon')
        expect(res.text).toContain('Nobody')
      })
  })
  it('GET /specialist-support/search should return the Specialist Support search page', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    return request(app)
      .get('/specialist-support/search')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Specialist support team override tool')
        expect(res.text).toContain('Look up a calculation')
        expect(res.text).toContain('Enter the calculation reference number')
      })
  })
  it('GET /specialist-support/search should not return the Specialist Support search page if you do not have permission', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(false)
    return request(app)
      .get('/specialist-support/search')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Not found')
      })
  })
  it('GET /specialist-support/search should not return the Specialist Support search page if you do not have permission', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(false)
    return request(app)
      .get('/specialist-support/search')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Not found')
      })
  })
  it('POST /specialist-support/search with no calc ref will show error', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    return request(app)
      .post('/specialist-support/search')
      .type('form')
      .send({})
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('You must enter a calculation reference number before continuing.')
      })
  })
  it('POST /specialist-support/search with calc ref that cannot be found will show error', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    calculateReleaseDatesService.getCalculationResultsByReference.mockResolvedValue(null)
    return request(app)
      .post('/specialist-support/search')
      .type('form')
      .send({ calculationReference: '123' })
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          'The calculation reference number you entered could not be found. Check the reference and try again.',
        )
      })
  })
  it('POST /specialist-support/search with calc ref that cannot be found will show error', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    calculateReleaseDatesService.getCalculationResultsByReference.mockResolvedValue(stubbedCalculationResults)
    return request(app)
      .post('/specialist-support/search')
      .type('form')
      .send({ calculationReference: '123' })
      .expect(302)
      .expect('Location', '/specialist-support/calculation/123')
      .expect(res => {
        expect(res.redirect).toBeTruthy()
      })
  })
  it('GET /specialist-support/calculation/:calculationReference should not return the Specialist Support confirm page if you do not have permission', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(false)
    return request(app)
      .get('/specialist-support/calculation/123')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Not found')
      })
  })
  it('GET /specialist-support/calculation/:calculationReference should return the Specialist Support confirm page with prisoner identity bar', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    calculateReleaseDatesService.getCalculationResultsByReference.mockResolvedValue(stubbedCalculationResults)
    prisonerService.getPrisonerDetailForSpecialistSupport.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .get('/specialist-support/calculation/123')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Specialist support team override tool')
        expect(res.text).toContain('Anon Nobody')
        expect(res.text).toContain('123')
      })
  })
  it('GET /specialist-support/calculation/:calculationReference should return error if no prisoner found', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    calculateReleaseDatesService.getCalculationResultsByReference.mockResolvedValue(stubbedCalculationResults)
    prisonerService.getPrisonerDetailForSpecialistSupport.mockResolvedValue(null)
    return request(app)
      .get('/specialist-support/calculation/123')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('A calculation or prisoner could not be found')
      })
  })
  it('GET /specialist-support/calculation/:calculationReference should return error if no calculation found', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    calculateReleaseDatesService.getCalculationResultsByReference.mockResolvedValue(null)
    prisonerService.getPrisonerDetailForSpecialistSupport.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .get('/specialist-support/calculation/123')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('A calculation or prisoner could not be found')
      })
  })
  it('GET /specialist-support/calculation/:calculationReference/reason should show the options', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    calculateReleaseDatesService.getCalculationResultsByReference.mockResolvedValue(stubbedCalculationResults)
    prisonerService.getPrisonerDetailForSpecialistSupport.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .get('/specialist-support/calculation/123/reason')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Other')
        expect(res.text).toContain('Select the reason for the override')
        expect(res.text).toContain('Order of imprisonment/warrant doesn’t match trial record sheet')
      })
  })
  it('POST /specialist-support/calculation/:calculationReference/reason without selection  will show error', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    calculateReleaseDatesService.getCalculationResultsByReference.mockResolvedValue(stubbedCalculationResults)
    prisonerService.getPrisonerDetailForSpecialistSupport.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .post('/specialist-support/calculation/123/reason')
      .type('form')
      .send({ overrideReason: null })
      .expect(302)
      .expect('Location', '/specialist-support/calculation/123/reason?noRadio=true')
  })
  it('POST /specialist-support/calculation/:calculationReference/reason without other reason  will show error', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    calculateReleaseDatesService.getCalculationResultsByReference.mockResolvedValue(stubbedCalculationResults)
    prisonerService.getPrisonerDetailForSpecialistSupport.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .post('/specialist-support/calculation/123/reason')
      .type('form')
      .send({ overrideReason: 'other', otherReason: '' })
      .expect(302)
      .expect('Location', '/specialist-support/calculation/123/reason?noOtherReason=true')
  })
  it('POST /specialist-support/calculation/:calculationReference/reason with reason will redirect', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    calculateReleaseDatesService.getCalculationResultsByReference.mockResolvedValue(stubbedCalculationResults)
    prisonerService.getPrisonerDetailForSpecialistSupport.mockResolvedValue(stubbedPrisonerData)
    fakeApi.post(`/specialist-support/genuine-override`).reply(200, {} as GenuineOverride)
    return request(app)
      .post('/specialist-support/calculation/123/reason')
      .type('form')
      .send({ overrideReason: 'terror', otherReason: '' })
      .expect(302)
      .expect('Location', '/specialist-support/calculation/123/select-date-types')
  })
})

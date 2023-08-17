import request from 'supertest'
import { Express } from 'express'
import { appWithAllRoutes } from './testutils/appSetup'
import UserPermissionsService from '../services/userPermissionsService'
import EntryPointService from '../services/entryPointService'
import PrisonerService from '../services/prisonerService'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import { BookingCalculation } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { PrisonApiPrisoner, PrisonApiSentenceDetail } from '../@types/prisonApi/prisonClientTypes'

let app: Express
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
  app = appWithAllRoutes({ userPermissionsService, entryPointService, calculateReleaseDatesService, prisonerService })
})

afterEach(() => {
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
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
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
})

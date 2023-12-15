import request from 'supertest'
import { Express } from 'express'
import { appWithAllRoutes } from './testutils/appSetup'
import UserPermissionsService from '../services/userPermissionsService'
import ComparisonService from '../services/comparisonService'
import { Comparison, ComparisonOverview } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ComparisonType from '../enumerations/comparisonType'

let app: Express

jest.mock('../services/userPermissionsService')
jest.mock('../services/comparisonService')
const userPermissionsService = new UserPermissionsService() as jest.Mocked<UserPermissionsService>
const comparisonService = new ComparisonService() as jest.Mocked<ComparisonService>

beforeEach(() => {
  app = appWithAllRoutes({ userPermissionsService, comparisonService })
  userPermissionsService.allowBulkComparison.mockReturnValue(true)
  userPermissionsService.allowManualComparison.mockReturnValue(true)
})

afterEach(() => {
  jest.resetAllMocks()
})

const comparison = {
  comparisonShortReference: 'ABC123',
  criteria: {},
  comparisonType: ComparisonType.MANUAL,
  calculatedAt: '2023-10-20T08:19:39.800Z',
  numberOfPeopleCompared: 10,
} as Comparison

const comparisonOverview = {
  comparisonShortReference: comparison.comparisonShortReference,
  calculatedAt: comparison.calculatedAt,
  numberOfPeopleCompared: 10,
  numberOfMismatches: 0,
  mismatches: [],
} as ComparisonOverview

describe('Compare routes tests', () => {
  it('GET /compare should return the Bulk Comparison index page', () => {
    return request(app)
      .get('/compare')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Perform bulk comparison of variations between offenders release dates')
      })
  })

  it('GET /compare/manual should return the Manual Comparison input page', () => {
    return request(app)
      .get('/compare/manual')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Manual Bulk Comparison')
        expect(res.text).toContain('textarea')
      })
  })

  it('POST /compare/manual should return the Manual Comparison input page', () => {
    comparisonService.createManualComparison.mockResolvedValue(comparison)
    comparisonService.getManualComparison.mockResolvedValue(comparisonOverview)

    return request(app)
      .post('/compare/manual')
      .send({ prisonerIds: 'ABC123D\r\n' })
      .expect(200)
      .redirects(1)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Bulk Comparison Results')
      })
  })
})

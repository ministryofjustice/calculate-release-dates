import request from 'supertest'
import { Express } from 'express'
import { appWithAllRoutes, user } from './testutils/appSetup'
import UserPermissionsService from '../services/userPermissionsService'
import ComparisonService from '../services/comparisonService'
import {
  Comparison,
  ComparisonOverview,
  ComparisonSummary,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ComparisonType from '../enumerations/comparisonType'

let app: Express

jest.mock('../services/userPermissionsService')
jest.mock('../services/comparisonService')
const userPermissionsService = new UserPermissionsService() as jest.Mocked<UserPermissionsService>
const comparisonService = new ComparisonService() as jest.Mocked<ComparisonService>

beforeEach(() => {
  app = appWithAllRoutes({
    services: { userPermissionsService, comparisonService },
    userSupplier: () => {
      return { ...user, caseloadMap: new Map([['HMP', 'HMP Prison']]) }
    },
  })
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
  comparisonType: ComparisonType.MANUAL,
  calculatedAt: comparison.calculatedAt,
  numberOfPeopleCompared: 10,
  numberOfMismatches: 0,
  mismatches: [],
  hdc4PlusCalculated: [],
} as ComparisonOverview

const comparisonSummaryWithFailures = {
  comparisonShortReference: 'foo',
  prison: 'HMP',
  comparisonType: 'ESTABLISHMENT_FULL',
  calculatedAt: '2020-01-01 10:53:46',
  calculatedByUsername: 'me',
  numberOfMismatches: 10,
  numberOfPeopleCompared: 15,
  numberOfPeopleComparisonFailedFor: 5,
} as ComparisonSummary

const comparisonSummaryNoFailures = {
  comparisonShortReference: 'bar',
  prison: 'HMP',
  comparisonType: 'ESTABLISHMENT_FULL',
  calculatedAt: '2020-01-01 10:53:46',
  calculatedByUsername: 'me',
  numberOfMismatches: 15,
  numberOfPeopleCompared: 15,
  numberOfPeopleComparisonFailedFor: 0,
} as ComparisonSummary

describe('Compare routes tests', () => {
  it('GET /compare should return the Bulk Comparison index page', () => {
    return request(app)
      .get('/compare')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          'Identify and compare any differences in the release dates' +
            ' calculated by staff, NOMIS and the Calculate release dates service.',
        )
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
        expect(res.text).toContain('Bulk comparison results')
      })
  })
  it('GET /compare/list should return the Bulk Comparison previous list page', () => {
    userPermissionsService.allowBulkComparison.mockReturnValue(true)
    comparisonService.getPrisonComparisons.mockResolvedValue([
      comparisonSummaryWithFailures,
      comparisonSummaryNoFailures,
    ])
    return request(app)
      .get('/compare/list')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('15 mismatches from 15 results - full comparison')
        expect(res.text).toContain('10 mismatches with 5 failures from 15 results - full comparison')
      })
  })
  it('GET /compare/manual/list should return the Bulk Comparison previous list page', () => {
    userPermissionsService.allowBulkComparison.mockReturnValue(true)
    comparisonService.getManualComparisons.mockResolvedValue([
      comparisonSummaryWithFailures,
      comparisonSummaryNoFailures,
    ])
    return request(app)
      .get('/compare/manual/list')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('15 mismatches from 15 results - full comparison')
        expect(res.text).toContain('10 mismatches with 5 failures from 15 results - full comparison')
      })
  })
  it('GET /compare/result/ref should return the Bulk Comparison overview page', () => {
    userPermissionsService.allowBulkComparison.mockReturnValue(true)
    comparisonService.getPrisonComparison.mockResolvedValue({
      ...comparisonOverview,
      numberOfPeopleComparisonFailedFor: 978654321,
    })
    return request(app)
      .get('/compare/result/foo')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Failed comparison count')
        expect(res.text).toContain('978654321')
      })
  })
  it('GET /compare/manual/result/ref should return the Bulk Comparison overview page', () => {
    userPermissionsService.allowBulkComparison.mockReturnValue(true)
    comparisonService.getManualComparison.mockResolvedValue({
      ...comparisonOverview,
      numberOfPeopleComparisonFailedFor: 123456789,
    })
    return request(app)
      .get('/compare/manual/result/foo')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Failed comparison count')
        expect(res.text).toContain('123456789')
      })
  })
  it('GET /compare/result/ref should return the Bulk Comparison overview page and hide failure count if none', () => {
    userPermissionsService.allowBulkComparison.mockReturnValue(true)
    comparisonService.getPrisonComparison.mockResolvedValue({
      ...comparisonOverview,
      numberOfPeopleComparisonFailedFor: 0,
    })
    return request(app)
      .get('/compare/result/foo')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('Failed comparison count')
      })
  })
  it('GET /compare/manual/result/ref should return the Bulk Comparison overview page and hide failure count if none', () => {
    userPermissionsService.allowBulkComparison.mockReturnValue(true)
    comparisonService.getManualComparison.mockResolvedValue({
      ...comparisonOverview,
      numberOfPeopleComparisonFailedFor: 0,
    })
    return request(app)
      .get('/compare/manual/result/foo')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('Failed comparison count')
      })
  })
})

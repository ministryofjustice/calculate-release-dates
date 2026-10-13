import request from 'supertest'
import { Express } from 'express'
import { appWithAllRoutes, user } from './testutils/appSetup'
import UserPermissionsService from '../services/userPermissionsService'
import ComparisonService from '../services/comparisonService'
import PrisonerService from '../services/prisonerService'
import {
  Comparison,
  ComparisonOverview,
  ComparisonSummary,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ComparisonType from '../enumerations/comparisonType'
import AuditService from '../services/auditService'

let app: Express

jest.mock('../services/userPermissionsService')
jest.mock('../services/comparisonService')
jest.mock('../services/prisonerService')
const userPermissionsService = new UserPermissionsService() as jest.Mocked<UserPermissionsService>
const auditService = new AuditService() as jest.Mocked<AuditService>
const comparisonService = new ComparisonService(auditService, null) as jest.Mocked<ComparisonService>
const prisonerService = new PrisonerService(null, null) as jest.Mocked<PrisonerService>

beforeEach(() => {
  app = appWithAllRoutes({
    services: { userPermissionsService, comparisonService, prisonerService },
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
  comparisonStatus: 'PROCESSING',
  status: 'PROCESSING',
  calculatedAt: comparison.calculatedAt,
  numberOfPeopleExpected: 20,
  numberOfPeopleCompared: 10,
  numberOfMismatches: 0,
  comparisonProgress: {
    percentageComplete: 50.0,
    expectedCompletionTime: '2030-01-01T13:00Z',
  },
  mismatches: [],
} as ComparisonOverview

const comparisonSummaryWithFailures = {
  comparisonShortReference: 'foo',
  prison: 'HMP',
  comparisonType: 'ESTABLISHMENT_FULL',
  calculatedAt: '2020-01-01 10:53:46',
  calculatedByUsername: 'me',
  comparisonStatus: 'PROCESSING',
  numberOfPeopleExpected: 20,
  numberOfMismatches: 10,
  numberOfPeopleCompared: 15,
  numberOfPeopleComparisonFailedFor: 5,
  comparisonProgress: {
    percentageComplete: 50.0,
    expectedCompletionTime: '2030-01-01T13:00Z',
  },
} as ComparisonSummary

const comparisonSummaryNoFailures = {
  comparisonShortReference: 'bar',
  prison: 'HMP',
  comparisonType: 'ESTABLISHMENT_FULL',
  comparisonStatus: 'PROCESSING',
  calculatedAt: '2020-01-01 10:53:46',
  calculatedByUsername: 'me',
  numberOfPeopleExpected: 20,
  numberOfMismatches: 15,
  numberOfPeopleCompared: 15,
  numberOfPeopleComparisonFailedFor: 0,
  comparisonProgress: {
    percentageComplete: 50.0,
    expectedCompletionTime: '2030-01-01T13:00Z',
  },
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
  it('GET /compare/list/others should return the Bulk Comparison previous list page for other users', () => {
    userPermissionsService.allowBulkComparison.mockReturnValue(true)
    comparisonService.searchComparisons.mockResolvedValue({
      content: [comparisonSummaryWithFailures, comparisonSummaryNoFailures],
      page: {
        size: 10,
        number: 0,
        totalElements: 2,
        totalPages: 1,
      },
    })
    prisonerService.getUsersCaseloads.mockResolvedValue([{ caseLoadId: 'HMP', description: 'HMP Prison' } as never])
    return request(app)
      .get('/compare/list/others')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('15 mismatches from 15 out of 20 results - full comparison')
        expect(res.text).toContain('50% complete. Expected completion time 01 January 2030 at 13:00')
        expect(res.text).toContain('10 mismatches with 5 failures from 15 out of 20 results - full comparison')
        expect(comparisonService.searchComparisons).toHaveBeenCalledWith('', false, 0, 10, 'user1')
        expect(prisonerService.getUsersCaseloads).toHaveBeenCalledWith('token')
      })
  })
  it('GET /compare/list should return the Bulk Comparison previous list page for the current user', () => {
    userPermissionsService.allowBulkComparison.mockReturnValue(true)
    comparisonService.searchComparisons.mockResolvedValue({
      content: [
        { ...comparisonSummaryWithFailures, calculatedByUsername: 'user1' },
        { ...comparisonSummaryNoFailures, calculatedByUsername: 'user1' },
      ],
      page: {
        size: 10,
        number: 0,
        totalElements: 2,
        totalPages: 1,
      },
    })
    prisonerService.getUsersCaseloads.mockResolvedValue([{ caseLoadId: 'HMP', description: 'HMP Prison' } as never])
    return request(app)
      .get('/compare/list')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('15 mismatches from 15 out of 20 results - full comparison')
        expect(res.text).toContain('50% complete. Expected completion time 01 January 2030 at 13:00')
        expect(res.text).toContain('10 mismatches with 5 failures from 15 out of 20 results - full comparison')
        expect(comparisonService.searchComparisons).toHaveBeenCalledWith('', true, 0, 10, 'user1')
        expect(prisonerService.getUsersCaseloads).toHaveBeenCalledWith('token')
      })
  })
  it('GET /compare/list?prisonName=all should search with the literal "all" prison filter and mark the All prisons option selected', () => {
    userPermissionsService.allowBulkComparison.mockReturnValue(true)
    comparisonService.searchComparisons.mockResolvedValue({
      content: [],
      page: { size: 10, number: 0, totalElements: 0, totalPages: 0 },
    })
    prisonerService.getUsersCaseloads.mockResolvedValue([{ caseLoadId: 'HMP', description: 'HMP Prison' } as never])
    return request(app)
      .get('/compare/list?prisonName=all')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(comparisonService.searchComparisons).toHaveBeenCalledWith('all', true, 0, 10, 'user1')
        expect(res.text).toMatch(/<option value="all" selected>All prisons<\/option>/)
      })
  })
  it('GET /compare/list with no prisonName should search with an empty prison filter and mark the "All comparisons" option selected', () => {
    userPermissionsService.allowBulkComparison.mockReturnValue(true)
    comparisonService.searchComparisons.mockResolvedValue({
      content: [],
      page: { size: 10, number: 0, totalElements: 0, totalPages: 0 },
    })
    prisonerService.getUsersCaseloads.mockResolvedValue([{ caseLoadId: 'HMP', description: 'HMP Prison' } as never])
    return request(app)
      .get('/compare/list')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(comparisonService.searchComparisons).toHaveBeenCalledWith('', true, 0, 10, 'user1')
        expect(res.text).toMatch(/<option value="allcomp" selected>All comparisons<\/option>/)
      })
  })
  it('GET /compare/list?prisonName=allcomp should search with an empty prison filter and mark the "All comparisons" option selected', () => {
    userPermissionsService.allowBulkComparison.mockReturnValue(true)
    comparisonService.searchComparisons.mockResolvedValue({
      content: [],
      page: { size: 10, number: 0, totalElements: 0, totalPages: 0 },
    })
    prisonerService.getUsersCaseloads.mockResolvedValue([{ caseLoadId: 'HMP', description: 'HMP Prison' } as never])
    return request(app)
      .get('/compare/list?prisonName=allcomp')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(comparisonService.searchComparisons).toHaveBeenCalledWith('', true, 0, 10, 'user1')
        expect(res.text).toMatch(/<option value="allcomp" selected>All comparisons<\/option>/)
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
        expect(res.text).toContain('15 mismatches from 15 out of 20 results - full comparison')
        expect(res.text).toContain('50% complete. Expected completion time 01 January 2030 at 13:00')
        expect(res.text).toContain('10 mismatches with 5 failures from 15 out of 20 results - full comparison')
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
        expect(res.text).toContain('50% complete. Expected completion time 01 January 2030 at 13:00')
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

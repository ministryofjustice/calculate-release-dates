import request from 'supertest'
import { Express } from 'express'
import config from '../config'
import { appWithAllRoutes, user } from './testutils/appSetup'
import UserPermissionsService from '../services/userPermissionsService'
import ComparisonService from '../services/comparisonService'
import PrisonerService from '../services/prisonerService'
import AuditService from '../services/auditService'
import {
  UnusedDeductionsComparisonOverview,
  UnusedDeductionsComparisonPersonDetail,
  UnusedDeductionsComparisonSummary,
} from '../@types/calculateReleaseDates/unusedDeductionsComparisonTypes'

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
    userSupplier: () => ({ ...user, isDigitalSupportUser: true, caseloadMap: new Map([['MDI', 'Moorland (HMP)']]) }),
  })
  userPermissionsService.allowBulkLoad.mockReturnValue(true)
  userPermissionsService.allowManualComparison.mockReturnValue(true)
  prisonerService.getUsersCaseloads.mockResolvedValue([{ caseLoadId: 'MDI', description: 'Moorland (HMP)' } as never])
})

afterEach(() => {
  jest.resetAllMocks()
})

const summary: UnusedDeductionsComparisonSummary = {
  comparisonShortReference: 'abc12345',
  prison: 'MDI',
  comparisonType: 'PRISON',
  comparisonStatus: 'COMPLETED',
  calculatedAt: '2026-11-02T10:00:00',
  calculatedByUsername: 'user1',
  numberOfMismatches: 2,
  numberOfValidationErrors: 1,
  numberOfPeopleExpected: 10,
  numberOfPeopleCompared: 10,
  numberOfPeopleComparisonFailedFor: 0,
  comparisonProgress: { percentageComplete: 100 },
}

const overview: UnusedDeductionsComparisonOverview = {
  comparison: summary,
  criteria: { prison: 'MDI' },
  page: { number: 0, size: 50, totalElements: 2, totalPages: 1 },
  people: [
    {
      personShortReference: 'def67890',
      person: 'A1234BC',
      lastName: 'Smith',
      establishment: 'MDI',
      outcome: 'MISMATCH',
      existingUnusedDeductions: 10,
      calculatedUnusedDeductions: 61,
      custodialDays: 122,
      totalDeductions: 183,
    },
    {
      personShortReference: 'ghi11111',
      person: 'B1234CD',
      lastName: 'Jones',
      establishment: 'MDI',
      outcome: 'MATCH',
      existingUnusedDeductions: 0,
      calculatedUnusedDeductions: 0,
      custodialDays: 400,
      totalDeductions: 100,
    },
  ],
}

const personDetail: UnusedDeductionsComparisonPersonDetail = {
  comparison: summary,
  person: overview.people[0],
  calculatedAt: '2026-11-02T10:05:00',
  fatalException: null,
  validationMessages: [],
  adjustments: [
    {
      id: 'a1',
      adjustmentType: 'REMAND',
      source: 'DPS',
      fromDate: '2026-01-01',
      toDate: '2026-07-02',
      days: 183,
      effectiveDays: 99,
    },
    {
      id: 'a2',
      adjustmentType: 'UNUSED_DEDUCTIONS',
      source: 'DPS',
      fromDate: null,
      toDate: null,
      days: 10,
      effectiveDays: 10,
    },
  ],
}

describe('Unused deductions comparison routes', () => {
  it('the bulk comparison index links to the unused deductions screens and names the release dates ones exactly', () => {
    return request(app)
      .get('/compare')
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('href="/compare/unused-deductions"')
        expect(res.text).toContain('Perform a bulk unused deductions calculation')
        expect(res.text).toContain('href="/compare/unused-deductions/list"')
        expect(res.text).toContain('View previous unused deductions calculations')
        expect(res.text).toContain('Perform a bulk calculate release dates comparison')
        expect(res.text).toContain('View previous calculate release dates comparisons')
        expect(res.text).toContain('Manual bulk calculate release dates comparison')
        expect(res.text).toContain('View manual calculate release dates comparisons')
      })
  })

  it('GET /compare/unused-deductions shows one form for manual, prison and all prison runs', () => {
    return request(app)
      .get('/compare/unused-deductions')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Bulk unused deductions calculation')
        expect(res.text).toContain('value="manual"')
        expect(res.text).toContain('value="prison"')
        expect(res.text).toContain('value="all"')
        expect(res.text).toContain('name="prisonerIds"')
        expect(res.text).toContain('Moorland (HMP)')
        expect(res.text).not.toContain('Previous runs')
        expect(comparisonService.getUnusedDeductionsComparisons).not.toHaveBeenCalled()
      })
  })

  it('GET /compare/unused-deductions/list shows previous runs', () => {
    comparisonService.getUnusedDeductionsComparisons.mockResolvedValue({
      content: [summary],
      page: { number: 0, size: 10, totalElements: 1, totalPages: 1 },
    })

    return request(app)
      .get('/compare/unused-deductions/list')
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Previous unused deductions calculations')
        expect(res.text).toContain('/compare/unused-deductions/result/abc12345')
        expect(res.text).toContain('2 mismatches')
        expect(comparisonService.getUnusedDeductionsComparisons).toHaveBeenCalledWith(
          0,
          config.unusedDeductionsList.pageSize,
          'user1',
        )
      })
  })

  it('GET /compare/unused-deductions/list says when there are no previous runs', () => {
    comparisonService.getUnusedDeductionsComparisons.mockResolvedValue({
      content: [],
      page: { number: 0, size: 10, totalElements: 0, totalPages: 0 },
    })

    return request(app)
      .get('/compare/unused-deductions/list')
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('No previous runs')
      })
  })

  it('GET list shows previous runs a page at a time with page numbers', () => {
    comparisonService.getUnusedDeductionsComparisons.mockResolvedValue({
      content: [summary],
      page: { number: 1, size: 10, totalElements: 25, totalPages: 3 },
    })

    return request(app)
      .get('/compare/unused-deductions/list?page=2')
      .expect(200)
      .expect(res => {
        expect(comparisonService.getUnusedDeductionsComparisons).toHaveBeenCalledWith(
          1,
          config.unusedDeductionsList.pageSize,
          'user1',
        )
        expect(res.text).toContain('href="/compare/unused-deductions/list?page=1"')
        expect(res.text).toContain('href="/compare/unused-deductions/list?page=3"')
        expect(res.text).toContain('Showing 11 to 20 of 25 total runs')
      })
  })

  it('GET list treats a bad page number as the first page', () => {
    comparisonService.getUnusedDeductionsComparisons.mockResolvedValue({
      content: [],
      page: { number: 0, size: 10, totalElements: 0, totalPages: 0 },
    })

    return request(app)
      .get('/compare/unused-deductions/list?page=abc')
      .expect(200)
      .expect(() => {
        expect(comparisonService.getUnusedDeductionsComparisons).toHaveBeenCalledWith(
          0,
          config.unusedDeductionsList.pageSize,
          'user1',
        )
      })
  })

  it('POST /compare/unused-deductions/run for a prison redirects to the result', () => {
    comparisonService.createUnusedDeductionsComparison.mockResolvedValue(summary)

    return request(app)
      .post('/compare/unused-deductions/run')
      .type('form')
      .send({ runType: 'prison', prison: 'MDI' })
      .expect(302)
      .expect('Location', '/compare/unused-deductions/result/abc12345')
      .expect(() => {
        expect(comparisonService.createUnusedDeductionsComparison).toHaveBeenCalledWith({ prison: 'MDI' }, 'user1')
      })
  })

  it('POST /compare/unused-deductions/run for all prisons sends the all marker', () => {
    comparisonService.createUnusedDeductionsComparison.mockResolvedValue(summary)

    return request(app)
      .post('/compare/unused-deductions/run')
      .type('form')
      .send({ runType: 'all', prison: 'MDI' })
      .expect(302)
      .expect(() => {
        expect(comparisonService.createUnusedDeductionsComparison).toHaveBeenCalledWith({ prison: 'all' }, 'user1')
      })
  })

  it('POST /compare/unused-deductions/run for a manual list trims blank lines and spaces', () => {
    comparisonService.createUnusedDeductionsComparison.mockResolvedValue(summary)

    return request(app)
      .post('/compare/unused-deductions/run')
      .type('form')
      .send({ runType: 'manual', prisonerIds: ' A1234BC \r\n\r\nB1234CD\r\n' })
      .expect(302)
      .expect(() => {
        expect(comparisonService.createUnusedDeductionsComparison).toHaveBeenCalledWith(
          { prisonerIds: ['A1234BC', 'B1234CD'] },
          'user1',
        )
      })
  })

  it.each([
    ['manual list is empty', { runType: 'manual', prisonerIds: '  \r\n' }],
    ['prison is not chosen', { runType: 'prison', prison: '' }],
    ['run type is missing', {}],
  ])('POST /compare/unused-deductions/run is rejected when the %s', (_, body) => {
    return request(app)
      .post('/compare/unused-deductions/run')
      .type('form')
      .send(body)
      .expect(400)
      .expect(res => {
        expect(res.text).toContain('govuk-error-summary')
        expect(comparisonService.createUnusedDeductionsComparison).not.toHaveBeenCalled()
      })
  })

  it('GET result shows each person with existing and calculated values, mismatches first', () => {
    comparisonService.getUnusedDeductionsComparison.mockResolvedValue(overview)

    return request(app)
      .get('/compare/unused-deductions/result/abc12345')
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Unused deductions comparison results')
        expect(res.text).toContain('A1234BC')
        expect(res.text).toContain('Smith')
        expect(res.text).toContain('Mismatch')
        expect(res.text).toContain('/compare/unused-deductions/result/abc12345/detail/def67890')
        expect(res.text.indexOf('A1234BC')).toBeLessThan(res.text.indexOf('B1234CD'))
        expect(res.text).toContain('>122<')
        expect(res.text).toContain('>183<')
        expect(comparisonService.getUnusedDeductionsComparison).toHaveBeenCalledWith(
          'abc12345',
          { outcome: undefined, prisonerId: undefined, page: 0, size: config.unusedDeductionsResults.pageSize },
          'user1',
        )
      })
  })

  it('GET result passes the filters and page to the api and keeps them in the form', () => {
    comparisonService.getUnusedDeductionsComparison.mockResolvedValue({
      ...overview,
      page: { number: 1, size: 50, totalElements: 120, totalPages: 3 },
    })

    return request(app)
      .get('/compare/unused-deductions/result/abc12345?outcome=MISMATCH&prisonerId=%20A12%20&page=2')
      .expect(200)
      .expect(res => {
        expect(comparisonService.getUnusedDeductionsComparison).toHaveBeenCalledWith(
          'abc12345',
          { outcome: 'MISMATCH', prisonerId: 'A12', page: 1, size: config.unusedDeductionsResults.pageSize },
          'user1',
        )
        expect(res.text).toContain('name="prisonerId"')
        expect(res.text).toContain('value="A12"')
        expect(res.text).toMatch(/<option value="MISMATCH"\s+selected/)
        expect(res.text).toContain('Showing 51 to 100 of 120 total people')
      })
  })

  it('GET result pagination links keep the filters', () => {
    comparisonService.getUnusedDeductionsComparison.mockResolvedValue({
      ...overview,
      page: { number: 1, size: 50, totalElements: 120, totalPages: 3 },
    })

    return request(app)
      .get('/compare/unused-deductions/result/abc12345?outcome=MISMATCH&prisonerId=A12&page=2')
      .expect(200)
      .expect(res => {
        expect(res.text).toContain(
          'href="/compare/unused-deductions/result/abc12345?outcome=MISMATCH&amp;prisonerId=A12&amp;page=1"',
        )
        expect(res.text).toContain(
          'href="/compare/unused-deductions/result/abc12345?outcome=MISMATCH&amp;prisonerId=A12&amp;page=2"',
        )
        expect(res.text).toContain(
          'href="/compare/unused-deductions/result/abc12345?outcome=MISMATCH&amp;prisonerId=A12&amp;page=3"',
        )
        expect(res.text).toContain('govuk-pagination__item--current')
      })
  })

  it('GET result ignores an unknown outcome and a bad page number', () => {
    comparisonService.getUnusedDeductionsComparison.mockResolvedValue(overview)

    return request(app)
      .get('/compare/unused-deductions/result/abc12345?outcome=BOGUS&page=-3')
      .expect(200)
      .expect(() => {
        expect(comparisonService.getUnusedDeductionsComparison).toHaveBeenCalledWith(
          'abc12345',
          { outcome: undefined, prisonerId: undefined, page: 0, size: config.unusedDeductionsResults.pageSize },
          'user1',
        )
      })
  })

  it('GET result explains when a completed run found nobody to compare', () => {
    comparisonService.getUnusedDeductionsComparison.mockResolvedValue({
      comparison: { ...summary, numberOfPeopleExpected: 0, numberOfPeopleCompared: 0, numberOfMismatches: 0 },
      criteria: {},
      people: [],
      page: { number: 0, size: 50, totalElements: 0, totalPages: 0 },
    })

    return request(app)
      .get('/compare/unused-deductions/result/abc12345')
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('No calculable prisoners were found for this comparison.')
        expect(res.text).not.toContain('<table')
      })
  })

  it('GET result explains when the filters match nobody', () => {
    comparisonService.getUnusedDeductionsComparison.mockResolvedValue({
      ...overview,
      people: [],
      page: { number: 0, size: 50, totalElements: 0, totalPages: 0 },
    })

    return request(app)
      .get('/compare/unused-deductions/result/abc12345?outcome=MATCH&prisonerId=ZZZ')
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('No people match the selected filters.')
        expect(res.text).not.toContain('No calculable prisoners were found')
      })
  })

  it('GET result says results are still to come while processing with nothing yet', () => {
    comparisonService.getUnusedDeductionsComparison.mockResolvedValue({
      comparison: { ...summary, comparisonStatus: 'PROCESSING', numberOfPeopleCompared: 0, numberOfMismatches: 0 },
      criteria: {},
      people: [],
      page: { number: 0, size: 50, totalElements: 0, totalPages: 0 },
    })

    return request(app)
      .get('/compare/unused-deductions/result/abc12345')
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('No results yet. Refresh this page to see progress.')
        expect(res.text).not.toContain('No calculable prisoners were found')
      })
  })

  it('GET result shows progress while still processing', () => {
    comparisonService.getUnusedDeductionsComparison.mockResolvedValue({
      ...overview,
      comparison: {
        ...summary,
        comparisonStatus: 'PROCESSING',
        numberOfPeopleCompared: 5,
        comparisonProgress: { percentageComplete: 50, expectedCompletionTime: '2030-01-01T13:00' },
      },
    })

    return request(app)
      .get('/compare/unused-deductions/result/abc12345')
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('50% complete')
      })
  })

  it('GET detail shows the adjustment inputs with days and effective days', () => {
    comparisonService.getUnusedDeductionsComparisonPerson.mockResolvedValue(personDetail)

    return request(app)
      .get('/compare/unused-deductions/result/abc12345/detail/def67890')
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Unused deductions detail')
        expect(res.text).toContain('A1234BC')
        expect(res.text).toContain('Remand')
        expect(res.text).toContain('Unused deductions')
        expect(res.text).toContain('>183<')
        expect(res.text).toContain('>99<')
        expect(res.text).toContain('Custodial days')
        expect(res.text).toContain('Total deductions')
        expect(comparisonService.getUnusedDeductionsComparisonPerson).toHaveBeenCalledWith(
          'abc12345',
          'def67890',
          'user1',
        )
      })
  })

  it('GET detail shows the fatal exception when the calculation failed', () => {
    comparisonService.getUnusedDeductionsComparisonPerson.mockResolvedValue({
      ...personDetail,
      person: { ...personDetail.person, outcome: 'FATAL_ERROR', calculatedUnusedDeductions: null },
      fatalException: 'boom',
    })

    return request(app)
      .get('/compare/unused-deductions/result/abc12345/detail/def67890')
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('boom')
      })
  })
})

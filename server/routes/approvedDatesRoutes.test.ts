import request from 'supertest'
import { Express } from 'express'
import nock from 'nock'
import * as cheerio from 'cheerio'
import PrisonerService from '../services/prisonerService'
import {
  PrisonAPIAssignedLivingUnit,
  PrisonApiPrisoner,
  PrisonApiSentenceDetail,
} from '../@types/prisonApi/prisonClientTypes'
import { appWithAllRoutes } from './testutils/appSetup'
import ApprovedDatesService from '../services/approvedDatesService'
import DateTypeConfigurationService from '../services/dateTypeConfigurationService'
import { expectMiniProfile } from './testutils/layoutExpectations'
import ManualEntryService from '../services/manualEntryService'
import SessionSetup from './testutils/sessionSetup'
import { ManualEntrySelectedDate } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { StorageResponseModel } from '../services/dateValidationService'
import config from '../config'
import { testDateTypeDefinitions } from '../testutils/createUserToken'
import { FullPageError } from '../types/FullPageError'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import AuditService from '../services/auditService'
import { ManualJourneySelectedDate } from '../types/ManualJourney'

jest.mock('../services/calculateReleaseDatesService')
jest.mock('../services/auditService')

let app: Express
let sessionSetup: SessionSetup
const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const dateTypeConfigurationService = new DateTypeConfigurationService()
const approvedDatesService = new ApprovedDatesService(dateTypeConfigurationService)
const auditService = new AuditService() as jest.Mocked<AuditService>
const calculateReleaseDatesService = new CalculateReleaseDatesService(
  auditService,
) as jest.Mocked<CalculateReleaseDatesService>
const manualEntryService = new ManualEntryService(dateTypeConfigurationService, null, calculateReleaseDatesService)

jest.mock('../services/prisonerService')

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
  assignedLivingUnit: {
    agencyName: 'Foo Prison (HMP)',
    description: 'D-2-003',
  } as PrisonAPIAssignedLivingUnit,
} as PrisonApiPrisoner

const expectedMiniProfile = {
  name: 'Nobody, Anon',
  dob: '24/06/2000',
  prisonNumber: 'A1234AA',
  establishment: 'Foo Prison (HMP)',
  location: 'D-2-003',
  status: 'Serving Life Imprisonment',
}
let fakeApi: nock.Scope
beforeEach(() => {
  sessionSetup = new SessionSetup()
  sessionSetup.sessionDoctor = req => {
    req.session.manualEntryRoutingForBookings = []
    req.session.calculationReasonId = 1
  }
  config.apis.calculateReleaseDates.url = 'http://localhost:8100'
  fakeApi = nock(config.apis.calculateReleaseDates.url)
  fakeApi.get('/reference-data/date-type', '').reply(200, testDateTypeDefinitions)
  calculateReleaseDatesService.validateDatesForManualEntry.mockResolvedValue({
    messages: [],
    messageType: null,
  })
  app = appWithAllRoutes({
    services: { prisonerService, approvedDatesService, manualEntryService },
    sessionSetup,
  })
})

afterEach(() => {
  jest.resetAllMocks()
  nock.cleanAll()
})

describe('Check access tests', () => {
  const runTest = async routes => {
    await Promise.all(
      routes.map(route =>
        request(app)
          [route.method.toLowerCase()](route.url)
          .expect(404)
          .expect('Content-Type', /html/)
          .expect(res => {
            expect(res.text).toContain('The details for this person cannot be found')
          }),
      ),
    )
  }

  it('Check urls no access when not in caseload', async () => {
    prisonerService.getPrisonerDetail.mockImplementation(() => {
      throw FullPageError.notInCaseLoadError()
    })
    prisonerService.checkPrisonerAccess.mockImplementation(() => {
      throw FullPageError.notInCaseLoadError()
    })

    const routes = [
      { method: 'GET', url: '/calculation/A1234AA/123456/approved-dates-question' },
      { method: 'GET', url: '/calculation/A1234AA/123456/select-approved-dates' },
      { method: 'GET', url: '/calculation/A1234AA/123456/remove?dateType=CRD' },
      { method: 'GET', url: '/calculation/A1234AA/123456/submit-dates' },
      { method: 'POST', url: '/calculation/A1234AA/123456/submit-dates' },
    ]

    await runTest(routes)
  })
})

describe('approvedDatesRoutes', () => {
  it('GET /calculation/:nomsId/:calculationRequestId/approved-dates-question asks the question', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .get('/calculation/A1234AA/123456/approved-dates-question')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Do you need to enter APD, HDCAD or ROTL dates?')
        expect(res.text).toContain('/calculation/A1234AA/summary/123456')
        expectMiniProfile(res.text, expectedMiniProfile)
        const $ = cheerio.load(res.text)
        expect($('[data-qa=cancel-link]').first().attr('href')).toStrictEqual(
          '/calculation/A1234AA/cancelCalculation?redirectUrl=/calculation/A1234AA/123456/approved-dates-question',
        )
      })
  })

  it('POST /calculation/:nomsId/:calculationRequestId/approved-dates-question without selecting shows error', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .post('/calculation/A1234AA/123456/approved-dates-question')
      .type('form')
      .send({})
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain("Please select either 'Yes' or 'No, save the calculation to NOMIS'")
        expectMiniProfile(res.text, expectedMiniProfile)
        const $ = cheerio.load(res.text)
        expect($('[data-qa=cancel-link]').first().attr('href')).toStrictEqual(
          '/calculation/A1234AA/cancelCalculation?redirectUrl=/calculation/A1234AA/123456/approved-dates-question',
        )
      })
  })
  it('POST /calculation/:nomsId/:calculationRequestId/approved-dates-question selecting no redirects you to confirm', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .post('/calculation/A1234AA/123456/approved-dates-question')
      .type('form')
      .send({ approvedDatesQuestion: 'no' })
      .expect(302)
      .expect('Location', '/calculation/A1234AA/123456/store')
      .expect(res => {
        expect(res.redirect).toBeTruthy()
      })
  })
  it('POST /calculation/:nomsId/:calculationRequestId/approved-dates-question selecting yes redirects you to select approved dates', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .post('/calculation/A1234AA/123456/approved-dates-question')
      .type('form')
      .send({ approvedDatesQuestion: 'yes' })
      .expect(302)
      .expect('Location', '/calculation/A1234AA/123456/select-approved-dates')
      .expect(res => {
        expect(res.redirect).toBeTruthy()
      })
  })
  it('GET /calculation/:nomsId/:calculationRequestId/select-approved-dates shows list of approved dates', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .get('/calculation/A1234AA/123456/select-approved-dates')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('APD')
        expect(res.text).toContain('HDCAD')
        expect(res.text).toContain('ROTL')
        expect(res.text).toContain('/calculation/A1234AA/123456/approved-dates-question')
        expectMiniProfile(res.text, expectedMiniProfile)
        const $ = cheerio.load(res.text)
        expect($('[data-qa=cancel-link]').first().attr('href')).toStrictEqual(
          '/calculation/A1234AA/cancelCalculation?redirectUrl=/calculation/A1234AA/123456/select-approved-dates',
        )
      })
  })
  it('POST /calculation/:nomsId/:calculationRequestId/select-approved-dates adds date to session', () => {
    return request(app)
      .post('/calculation/A1234AA/123456/select-approved-dates')
      .type('form')
      .send({ dateSelect: 'APD' })
      .expect(302)
      .expect('Location', '/calculation/A1234AA/123456/submit-dates?dateType=APD')
      .expect(res => {
        expect(res.text).not.toContain('Select at least one release date.')
      })
  })

  it('POST /calculation/:nomsId/:calculationRequestId/select-approved-dates shows selection with error if no date selected', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .post('/calculation/A1234AA/123456/select-approved-dates')
      .type('form')
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('APD')
        expect(res.text).toContain('HDCAD')
        expect(res.text).toContain('ROTL')
        expectMiniProfile(res.text, expectedMiniProfile)
        const $ = cheerio.load(res.text)
        expect($('[data-qa=cancel-link]').first().attr('href')).toStrictEqual(
          '/calculation/A1234AA/cancelCalculation?redirectUrl=/calculation/A1234AA/123456/select-approved-dates',
        )
      })
  })

  it('GET /calculation/:nomsId/:calculationRequestId/remove loads remove date page if the date is found', () => {
    const nomsId = 'A1234AA'
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    sessionSetup.sessionDoctor = req => {
      req.session.selectedApprovedDates = {}
      req.session.selectedApprovedDates[nomsId] = [
        {
          dateType: 'CRD',
          dateText: 'CRD (Conditional release date)',
          date: { day: 3, month: 3, year: 2017 },
        } as ManualEntrySelectedDate,
      ]
    }

    return request(app)
      .get(`/calculation/${nomsId}/123456/remove?dateType=CRD`)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Are you sure you want to delete the CRD?')
        expectMiniProfile(res.text, expectedMiniProfile)
        const $ = cheerio.load(res.text)
        expect($('[data-qa=cancel-link]').first().attr('href')).toStrictEqual(
          '/calculation/A1234AA/cancelCalculation?redirectUrl=/calculation/A1234AA/123456/remove?dateType=CRD',
        )
      })
  })

  it('POST /calculation/:nomsId/:calculationRequestId/remove loads remove date page if submitting a date without confirmation', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .post('/calculation/A1234AA/123456/remove?dateType=CRD')
      .type('form')
      .send({ 'remove-date': '' })
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-qa=cancel-link]').first().attr('href')).toStrictEqual(
          '/calculation/A1234AA/cancelCalculation?redirectUrl=/calculation/A1234AA/123456/remove?dateType=CRD',
        )
        const questionTitle = $('.govuk-fieldset__legend--xl').first()
        expect(questionTitle.text().trim()).toStrictEqual('Are you sure you want to delete the CRD?')
        expect(res.text).toContain('You must select either &#39;Yes&#39; or &#39;No&#39;')
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })

  it('GET /calculation/:nomsId/:calculationRequestId/submit-dates loads submit dates page with mini profile', () => {
    const nomsId = 'A1234AA'
    sessionSetup.sessionDoctor = req => {
      req.session.selectedApprovedDates = {}
      req.session.selectedApprovedDates[nomsId] = [
        {
          dateType: 'CRD',
          dateText: 'CRD (Conditional release date)',
          date: undefined,
        } as ManualEntrySelectedDate,
      ]
      req.session.HDCED = {}
      req.session.HDCED[nomsId] = '2020-01-01'
      req.session.HDCED_WEEKEND_ADJUSTED = {}
      req.session.HDCED_WEEKEND_ADJUSTED[nomsId] = false
    }
    jest.spyOn(manualEntryService, 'getNextDateToEnter').mockReturnValue({
      position: 1,
      dateType: 'CRD',
      completed: false,
      manualEntrySelectedDate: {
        dateType: 'CRD',
        dateText: 'CRD (Conditional release date)',
        date: { day: 3, month: 3, year: 2017 },
      },
    } as ManualJourneySelectedDate)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .get('/calculation/A1234AA/123456/submit-dates')
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const questionTitle = $('.govuk-fieldset__legend--xl').first()
        expect(questionTitle.text().trim()).toStrictEqual('Enter the CRD')
        expectMiniProfile(res.text, expectedMiniProfile)
        expect($('[data-qa=cancel-link]').first().attr('href')).toStrictEqual(
          '/calculation/A1234AA/cancelCalculation?redirectUrl=/calculation/A1234AA/123456/submit-dates',
        )
      })
  })

  it('GET /calculation/:nomsId/:calculationRequestId/submit-dates with query params loads the correct content', () => {
    const nomsId = 'A1234AA'
    sessionSetup.sessionDoctor = req => {
      req.session.selectedApprovedDates = {}
      req.session.selectedApprovedDates[nomsId] = [
        {
          dateType: 'CRD',
          dateText: 'CRD (Conditional release date)',
          date: undefined,
        } as ManualEntrySelectedDate,
      ]
      req.session.HDCED = {}
      req.session.HDCED[nomsId] = '2020-01-01'
      req.session.HDCED_WEEKEND_ADJUSTED = {}
      req.session.HDCED_WEEKEND_ADJUSTED[nomsId] = false
    }
    jest.spyOn(manualEntryService, 'getNextDateToEnter').mockReturnValue({
      position: 1,
      dateType: 'CRD',
      completed: false,
      manualEntrySelectedDate: {
        dateType: 'CRD',
        dateText: 'CRD (Conditional release date)',
        date: { day: 3, month: 3, year: 2017 },
      },
    } as ManualJourneySelectedDate)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .get('/calculation/A1234AA/123456/submit-dates?year=2029&month=09&day=23')
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const questionTitle = $('.govuk-fieldset__legend--xl').first()
        expect(questionTitle.text().trim()).toStrictEqual('Enter the CRD')
        expectMiniProfile(res.text, expectedMiniProfile)
        expect($('[data-qa=cancel-link]').first().attr('href')).toStrictEqual(
          '/calculation/A1234AA/cancelCalculation?redirectUrl=/calculation/A1234AA/123456/submit-dates?year=2029&month=09&day=23',
        )
      })
  })

  it('POST /calculation/:nomsId/:calculationRequestId/submit-dates loads submit dates page with mini profile if storing fails', () => {
    const nomsId = 'A1234AA'
    sessionSetup.sessionDoctor = req => {
      req.session.selectedApprovedDates = {}
      req.session.selectedApprovedDates[nomsId] = [
        {
          position: 1,
          dateType: 'CRD',
          completed: false,
          manualEntrySelectedDate: {
            dateType: 'CRD',
            dateText: 'CRD (Conditional release date)',
            date: { day: 3, month: 3, year: 2017 },
          },
        } as ManualJourneySelectedDate,
      ]
    }
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    jest.spyOn(manualEntryService, 'storeDate').mockReturnValue({
      success: false,
      isNone: false,
      message: 'Foo',
    } as StorageResponseModel)

    return request(app)
      .post('/calculation/A1234AA/123456/submit-dates?dateType=CRD')
      .expect(200)
      .expect(res => {
        expectMiniProfile(res.text, expectedMiniProfile)
        const $ = cheerio.load(res.text)
        expect($('[data-qa=cancel-link]').first().attr('href')).toStrictEqual(
          '/calculation/A1234AA/cancelCalculation?redirectUrl=/calculation/A1234AA/123456/submit-dates?dateType=CRD',
        )
      })
  })
})

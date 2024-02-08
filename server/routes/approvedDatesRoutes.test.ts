import request from 'supertest'
import { Express } from 'express'
import PrisonerService from '../services/prisonerService'
import { PrisonApiPrisoner, PrisonApiSentenceDetail } from '../@types/prisonApi/prisonClientTypes'
import { appWithAllRoutes } from './testutils/appSetup'
import ApprovedDatesService from '../services/approvedDatesService'
import DateTypeConfigurationService from '../services/dateTypeConfigurationService'

let app: Express
const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const dateTypeConfigurationService = new DateTypeConfigurationService()
const approvedDatesService = new ApprovedDatesService(dateTypeConfigurationService)
jest.mock('../services/prisonerService')

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
  app = appWithAllRoutes({
    services: { prisonerService, approvedDatesService },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('approvedDatesRoutes', () => {
  it('GET /calculation/:nomsId/:calculationRequestId/approved-dates-question asks the question', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .get('/calculation/A1234AA/123456/approved-dates-question')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Do you need to enter APD, HDCAD or ROTL dates for Anon Nobody?')
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
      })
  })
  it('POST /calculation/:nomsId/:calculationRequestId/select-approved-dates adds date to session', () => {
    return request(app)
      .post('/calculation/A1234AA/123456/select-approved-dates')
      .type('form')
      .send({ dateSelect: 'APD' })
      .expect(302)
      .expect('Location', '/calculation/A1234AA/123456/submit-dates')
      .expect(res => {
        expect(res.text).not.toContain('Select at least one release date.')
      })
  })
})

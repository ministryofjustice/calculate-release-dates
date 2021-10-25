import request from 'supertest'
import type { Express } from 'express'
import { appWithAllRoutes } from './testutils/appSetup'
import PrisonerService from '../services/prisonerService'
import UserService from '../services/userService'
import {
  PrisonApiOffenderOffence,
  PrisonApiOffenderSentenceAndOffences,
  PrisonApiPrisoner,
  PrisonApiSentenceDetail,
} from '../@types/prisonApi/prisonClientTypes'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import { BookingCalculation } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

jest.mock('../services/userService')
jest.mock('../services/calculateReleaseDatesService')
jest.mock('../services/prisonerService')

const userService = new UserService(null) as jest.Mocked<UserService>
const calculateReleaseDatesService = new CalculateReleaseDatesService(null) as jest.Mocked<CalculateReleaseDatesService>
const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>

let app: Express

const stubbedPrisonerData = {
  offenderNo: 'A1234AA',
  firstName: 'Ringo',
  lastName: 'Starr',
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

const stubbedSentencesAndOffences = [
  {
    years: 3,
    offences: [
      { offenceEndDate: '2021-02-03' } as PrisonApiOffenderOffence,
      { offenceStartDate: '2021-01-03', offenceEndDate: '2021-01-04' } as PrisonApiOffenderOffence,
      { offenceStartDate: '2021-03-03' } as PrisonApiOffenderOffence,
    ],
  } as PrisonApiOffenderSentenceAndOffences,
]

const stubbedCalculationResults = {
  dates: {
    CRD: '2021-02-03',
  },
  calculationRequestId: 123456,
} as BookingCalculation

beforeEach(() => {
  app = appWithAllRoutes({ userService, prisonerService, calculateReleaseDatesService })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Prisoner routes', () => {
  it('GET /calculation/:nomsId/check-information should return detail about the prisoner', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    prisonerService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    return request(app)
      .get('/calculation/A1234AA/check-information')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('A1234AA')
        expect(res.text).toContain('Ringo')
        expect(res.text).toContain('Starr')
        expect(res.text).toContain('There are 3 offences included in this calculation')
        expect(res.text).toContain('Committed on 03 February 2021')
        expect(res.text).toContain('Committed on 04 January 2021')
        expect(res.text).toContain('Committed on 03 March 2021')
      })
  })

  it('GET /calculation/:nomsId/summary/:calculationRequestId should return details about the calculation requested', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationResults.mockResolvedValue(stubbedCalculationResults)
    return request(app)
      .get('/calculation/A1234AB/summary/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Conditional release date (CRD)')
        expect(res.text).toContain('Wednesday, 03 February 2021')
        expect(res.text).not.toContain('SLED')
      })
  })

  it('GET /calculation/:nomsId/complete should return details about the calculation requested', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationResults.mockResolvedValue(stubbedCalculationResults)
    return request(app)
      .get('/calculation/A1234AB/complete')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Calculation complete for Ringo Starr')
      })
  })
})

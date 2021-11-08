import request from 'supertest'
import type { Express } from 'express'
import { HttpError } from 'http-errors'
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
import {
  BookingCalculation,
  CalculationBreakdown,
  DateBreakdown,
  WorkingDay,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

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
    HDCED: '2021-10-03',
  },
  calculationRequestId: 123456,
} as BookingCalculation
const stubbedWeekendAdjustments: { [key: string]: WorkingDay } = {
  CRD: {
    date: '2021-02-02',
    adjustedForWeekend: true,
    adjustedForBankHoliday: false,
  },
  HDCED: {
    date: '2021-10-05',
    adjustedForWeekend: true,
    adjustedForBankHoliday: true,
  },
}

const stubbedCalculationBreakdown: CalculationBreakdown = {
  concurrentSentences: [
    {
      dates: {
        CRD: {
          adjusted: '2021-02-03',
          unadjusted: '2021-01-15',
          daysBetween: 18,
        },
      },
      sentenceLength: '2 years',
      sentenceLengthDays: 785,
      sentencedAt: '2020-01-01',
      sequence: '1',
    },
  ],
}

const stubbedEffectiveDates: { [key: string]: DateBreakdown } = {
  CRD: {
    adjusted: '2021-02-03',
    unadjusted: '2021-01-15',
    daysBetween: 18,
  },
  HDCED: {
    adjusted: '2021-10-28',
    unadjusted: '2021-01-15',
    daysBetween: 18,
  },
}

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
    calculateReleaseDatesService.getWeekendAdjustments.mockResolvedValue(stubbedWeekendAdjustments)
    return request(app)
      .get('/calculation/A1234AB/summary/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Conditional release date (CRD)')
        expect(res.text).toContain('Tuesday, 02 February 2021')
        expect(res.text).toContain('Wednesday, 03 February 2021 adjusted for weekend')
        expect(res.text).toContain('Home detention curfew eligibility date (HDCED)')
        expect(res.text).toContain('Tuesday, 05 October 2021')
        expect(res.text).toContain('Sunday, 03 October 2021 adjusted for Bank Holiday')
        expect(res.text).not.toContain('SLED')
      })
  })

  it('GET /calculation/:nomsId/summary/:calculationRequestId/breakdown should return details about the calculation requested and its breakdown', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationResults.mockResolvedValue(stubbedCalculationResults)
    calculateReleaseDatesService.getWeekendAdjustments.mockResolvedValue(stubbedWeekendAdjustments)
    calculateReleaseDatesService.getCalculationBreakdown.mockResolvedValue(stubbedCalculationBreakdown)
    calculateReleaseDatesService.getEffectiveDates.mockResolvedValue(stubbedEffectiveDates as never) // weird
    return request(app)
      .get('/calculation/A1234AB/summary/123456/breakdown')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Concurrent sentences')
        expect(res.text).toContain('1 sentences')
        expect(res.text).toContain('Consecutive sentence')
        expect(res.text).toContain('N/A')
        expect(res.text).toContain('Effective dates')
        expect(res.text).toContain('Friday, 15 January 2021 - 18 days = Wednesday, 03 February 2021')
      })
  })

  it('GET /calculation/:nomsId/complete should return details about the calculation requested', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationResults.mockResolvedValue(stubbedCalculationResults)
    return request(app)
      .get('/calculation/A1234AB/complete/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toMatch(/Calculation complete for<br>\s*Ringo Starr/)
      })
  })

  it('GET /calculation/:nomsId/summary/:calculationRequestId/print should return a printable page about the calculation requested', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationResults.mockResolvedValue(stubbedCalculationResults)
    calculateReleaseDatesService.getWeekendAdjustments.mockResolvedValue(stubbedWeekendAdjustments)
    return request(app)
      .get('/calculation/A1234AB/summary/123456/print')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toMatch(/<script src="\/assets\/print.js"><\/script>/)
        expect(res.text).toMatch(/Calculation/)
      })
  })

  it('POST /calculation/:nomsId/summary/:calculationRequestId should redirect if an error is thrown', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    const error = {
      status: 412,
      message: 'An error has occurred',
    } as HttpError

    calculateReleaseDatesService.confirmCalculation.mockImplementation(() => {
      throw error
    })
    return request(app)
      .post('/calculation/A1234AB/summary/123456')
      .expect(302)
      .expect(res => {
        expect(res.redirect).toBeTruthy()
      })
  })
})

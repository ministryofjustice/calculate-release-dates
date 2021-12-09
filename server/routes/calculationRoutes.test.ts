import request from 'supertest'
import type { Express } from 'express'
import { HttpError } from 'http-errors'
import { appWithAllRoutes } from './testutils/appSetup'
import PrisonerService from '../services/prisonerService'
import UserService from '../services/userService'
import {
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
import EntryPointService from '../services/entryPointService'
import { FullPageError } from '../types/FullPageError'

jest.mock('../services/userService')
jest.mock('../services/calculateReleaseDatesService')
jest.mock('../services/prisonerService')
jest.mock('../services/entryPointService')

const userService = new UserService(null) as jest.Mocked<UserService>
const calculateReleaseDatesService = new CalculateReleaseDatesService(null) as jest.Mocked<CalculateReleaseDatesService>
const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const entryPointService = new EntryPointService() as jest.Mocked<EntryPointService>

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

const stubbedSentencesAndOffences = [
  {
    years: 3,
    sentenceTypeDescription: 'SDS Standard Sentence',
    caseSequence: 1,
    lineSequence: 1,
    sentenceSequence: 1,
    offences: [
      { offenceEndDate: '2021-02-03' },
      { offenceStartDate: '2021-01-04', offenceEndDate: '2021-01-05' },
      { offenceStartDate: '2021-03-06' },
      {},
      { offenceStartDate: '2021-01-07', offenceEndDate: '2021-01-07' },
    ],
  } as PrisonApiOffenderSentenceAndOffences,
  {
    years: 2,
    caseSequence: 2,
    lineSequence: 2,
    sentenceSequence: 2,
    consecutiveToSequence: 1,
    sentenceTypeDescription: 'SDS Standard Sentence',
    offences: [{ offenceEndDate: '2021-02-03' }],
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
          adjustedByDays: 18,
          daysFromSentenceStart: 100,
        },
      },
      sentenceLength: '2 years',
      sentenceLengthDays: 785,
      sentencedAt: '2020-01-01',
      lineSequence: 2,
      caseSequence: 1,
    },
  ],
}

const stubbedEffectiveDates: { [key: string]: DateBreakdown } = {
  CRD: {
    adjusted: '2021-02-03',
    unadjusted: '2021-01-15',
    adjustedByDays: 18,
    daysFromSentenceStart: 100,
  },
}

beforeEach(() => {
  app = appWithAllRoutes({ userService, prisonerService, calculateReleaseDatesService, entryPointService })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Calculation routes tests', () => {
  it('GET /calculation/:nomsId/summary/:calculationRequestId should return details about the calculation requested', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationResults.mockResolvedValue(stubbedCalculationResults)
    calculateReleaseDatesService.getWeekendAdjustments.mockResolvedValue(stubbedWeekendAdjustments)
    calculateReleaseDatesService.getCalculationBreakdown.mockResolvedValue(stubbedCalculationBreakdown)
    calculateReleaseDatesService.getEffectiveDates.mockResolvedValue(stubbedEffectiveDates as never)
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
        // expect(res.text).not.toContain('SLED')
        // This is now displayed as part of breakdown even IF the dates don't contain a SLED.
        // The design without SLED will come in time
        expect(res.text).toContain('Concurrent sentences')
        expect(res.text).toContain('Consecutive sentence')
        expect(res.text).toContain('Release dates with adjustments')
        expect(res.text).toContain('03 February 2021')
        expect(res.text).toContain('15 January 2021 – 18 days')
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
        expect(entryPointService.clearEntryPoint.mock.calls.length).toBe(1)
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

describe('Calculation routes tests related to check-information', () => {
  it('GET /calculation/:nomsId/check-information should return detail about the prisoner', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    prisonerService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    entryPointService.isDpsEntryPoint.mockResolvedValue(true as never)
    return request(app)
      .get('/calculation/A1234AA/check-information')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('A1234AA')
        expect(res.text).toContain('Ringo')
        expect(res.text).toContain('Starr')
        expect(res.text).toContain('There are 6 sentences from NOMIS to be included in this calculation.')
        expect(res.text).toContain('Court case 1')
        expect(res.text).toContain('Committed on 03 February 2021')
        expect(res.text).toContain('Committed between 04 January 2021 and 05 January 2021')
        expect(res.text).toContain('Committed on 06 March 2021')
        expect(res.text).toContain('Offence date not entered')
        expect(res.text).toContain('Committed on 07 January 2021')
        expect(res.text).toContain('SDS Standard Sentence')
        expect(res.text).toContain('Court case 2')
        expect(res.text).toContain('consecutive to')
        expect(res.text).toContain('court case 1 count 1')
        expect(res.text).toContain('href="/?prisonId=A1234AA"')
      })
  })

  it('GET /calculation/:nomsId/check-information should display errors when they exist', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    prisonerService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    calculateReleaseDatesService.validateNomisInformation.mockReturnValue([
      { text: 'An error occurred with the nomis information' },
    ])
    return request(app)
      .get('/calculation/A1234AA/check-information?hasErrors=true')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('An error occurred with the nomis information')
        expect(res.text).toContain('Update these details in NOMIS and then')
      })
  })

  it('GET /calculation/:nomsId/check-information should not display errors once they have been resolved', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    prisonerService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    calculateReleaseDatesService.validateNomisInformation.mockReturnValue([])
    return request(app)
      .get('/calculation/A1234AA/check-information?hasErrors=true')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('Update these details in NOMIS and then')
      })
  })

  it('POST /calculation/:nomsId/check-information should redirect if validation fails', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    prisonerService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    calculateReleaseDatesService.validateNomisInformation.mockReturnValue([
      { text: 'An error occurred with the nomis information' },
    ])

    return request(app)
      .post('/calculation/A1234AA/check-information')
      .expect(302)
      .expect(res => {
        expect(res.redirect).toBeTruthy()
      })
  })

  it('GET /calculation/:nomsId/check-information should display error page for case load errors.', () => {
    prisonerService.getPrisonerDetail.mockImplementation(() => {
      throw FullPageError.notInCaseLoadError()
    })
    return request(app)
      .get('/calculation/A1234AA/check-information')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('There is a problem')
        expect(res.text).toContain('The details for this person cannot be found.')
      })
  })
})

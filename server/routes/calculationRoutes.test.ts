import request from 'supertest'
import type { Express } from 'express'
import { HttpError } from 'http-errors'
import { appWithAllRoutes } from './testutils/appSetup'
import PrisonerService from '../services/prisonerService'
import UserService from '../services/userService'
import { PrisonApiPrisoner, PrisonApiSentenceDetail } from '../@types/prisonApi/prisonClientTypes'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import {
  BookingCalculation,
  CalculationBreakdown,
  WorkingDay,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import EntryPointService from '../services/entryPointService'
import ReleaseDateWithAdjustments from '../@types/calculateReleaseDates/releaseDateWithAdjustments'
import UserInputService from '../services/userInputService'
import {
  pedAdjustedByCrdAndBeforePrrdBreakdown,
  pedAdjustedByCrdAndBeforePrrdReleaseDates,
} from '../services/breakdownExamplesTestData'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/PrisonApiOffenderSentenceAndOffences'
import ViewReleaseDatesService from '../services/viewReleaseDatesService'

jest.mock('../services/userService')
jest.mock('../services/calculateReleaseDatesService')
jest.mock('../services/prisonerService')
jest.mock('../services/entryPointService')
jest.mock('../services/userInputService')
jest.mock('../services/viewReleaseDatesService')

const userService = new UserService(null) as jest.Mocked<UserService>
const calculateReleaseDatesService = new CalculateReleaseDatesService() as jest.Mocked<CalculateReleaseDatesService>
const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const entryPointService = new EntryPointService() as jest.Mocked<EntryPointService>
const userInputService = new UserInputService() as jest.Mocked<UserInputService>
const viewReleaseDatesService = new ViewReleaseDatesService() as jest.Mocked<ViewReleaseDatesService>

let app: Express

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

const stubbedCalculationResults = {
  dates: {
    CRD: '2021-02-03',
    SED: '2021-02-03',
    HDCED: '2021-10-03',
  },
  calculationRequestId: 123456,
  effectiveSentenceLength: {},
  prisonerId: 'A1234AB',
  calculationStatus: 'CONFIRMED',
  bookingId: 123,
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
        SED: {
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
  breakdownByReleaseDateType: {},
  otherDates: {},
}

const stubbedLicenceCalculationBreakdown: CalculationBreakdown = {
  concurrentSentences: [
    {
      dates: {
        CRD: {
          adjusted: '2021-02-03',
          unadjusted: '2021-01-15',
          adjustedByDays: 18,
          daysFromSentenceStart: 100,
        },
        SED: {
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
  breakdownByReleaseDateType: {},
  otherDates: {
    PRRD: '2021-10-04',
  },
}

const stubbedReleaseDatesWithAdjustments: ReleaseDateWithAdjustments[] = [
  {
    releaseDateType: 'CRD',
    releaseDate: '2021-02-03',
    hintText: '15 January 2021 minus 18 days',
  },
  {
    releaseDateType: 'HDCED',
    releaseDate: '13 May 2029',
    hintText: '14 May 2029 minus 1 day',
  },
]

const stubbedSentencesAndOffences = [
  {
    terms: [
      {
        years: 3,
      },
    ],
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
    terms: [
      {
        years: 2,
      },
    ],
    caseSequence: 2,
    lineSequence: 2,
    sentenceSequence: 2,
    consecutiveToSequence: 1,
    sentenceTypeDescription: 'SDS Standard Sentence',
    offences: [{ offenceEndDate: '2021-02-03', offenceCode: '123' }],
  } as PrisonApiOffenderSentenceAndOffences,
]
beforeEach(() => {
  app = appWithAllRoutes({
    userService,
    prisonerService,
    calculateReleaseDatesService,
    entryPointService,
    userInputService,
    viewReleaseDatesService,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Calculation routes tests', () => {
  it('GET /calculation/:nomsId/summary/:calculationRequestId should return details about the calculation requested', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationResults.mockResolvedValue(stubbedCalculationResults)
    calculateReleaseDatesService.getWeekendAdjustments.mockResolvedValue(stubbedWeekendAdjustments)
    calculateReleaseDatesService.getBreakdown.mockResolvedValue({
      calculationBreakdown: stubbedCalculationBreakdown,
      releaseDatesWithAdjustments: stubbedReleaseDatesWithAdjustments,
    })
    viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    return request(app)
      .get('/calculation/A1234AB/summary/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Conditional release date (CRD)')
        expect(res.text).toContain('Wednesday, 03 February 2021')
        expect(res.text).toContain('Tuesday, 02 February 2021 when adjusted to a working day')
        expect(res.text).toContain('Home detention curfew eligibility date (HDCED)')
        expect(res.text).toContain('Sunday, 03 October 2021')
        expect(res.text).toContain('Tuesday, 05 October 2021 when adjusted to a working day')
        // expect(res.text).not.toContain('SLED')
        // This is now displayed as part of breakdown even IF the dates don't contain a SLED.
        // The design without SLED will come in time
        expect(res.text).toContain('Sentence')
        expect(res.text).not.toContain('Consecutive sentence')
        expect(res.text).toContain('Release dates with adjustments')
        expect(res.text).toContain('03 February 2021')
        expect(res.text).toContain('15 January 2021 minus 18 days')
        expect(res.text).toContain('HDCED with adjustments')
        expect(res.text).toContain('13 May 2029')
        expect(res.text).toContain('14 May 2029 minus 1 day')
        expect(res.text).toContain(
          `Some release dates and details are not included because they are not relevant to this person's sentences`
        )
      })
  })

  it('GET /calculation/:nomsId/summary/:calculationRequestId should return details about the ped adjusted release dates', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationResults.mockResolvedValue(pedAdjustedByCrdAndBeforePrrdReleaseDates())
    calculateReleaseDatesService.getWeekendAdjustments.mockResolvedValue(stubbedWeekendAdjustments)
    calculateReleaseDatesService.getBreakdown.mockResolvedValue({
      calculationBreakdown: pedAdjustedByCrdAndBeforePrrdBreakdown(),
      releaseDatesWithAdjustments: stubbedReleaseDatesWithAdjustments,
    })
    viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    return request(app)
      .get('/calculation/A1234AA/summary/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('PED adjusted for the CRD of a concurrent sentence')
        expect(res.text).toContain(
          'The post recall release date (PRRD) of Saturday, 12 October 2024 is later than the PED'
        )
      })
  })

  it('GET /calculation/:nomsId/summary/:calculationRequestId should return details about the calculation requested with license recall', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationResults.mockResolvedValue(stubbedCalculationResults)
    calculateReleaseDatesService.getWeekendAdjustments.mockResolvedValue(stubbedWeekendAdjustments)
    calculateReleaseDatesService.getBreakdown.mockResolvedValue({
      calculationBreakdown: stubbedLicenceCalculationBreakdown,
      releaseDatesWithAdjustments: stubbedReleaseDatesWithAdjustments,
    })
    viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    return request(app)
      .get('/calculation/A1234AB/summary/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Release on HDC must not take place before the PRRD Monday, 04 October 2021')
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
        expect(res.text).toMatch(/Calculation complete for<br>\s*Anon Nobody/)
        expect(res.text).toContain('Back to Digital Prison Service (DPS) search')
        expect(entryPointService.clearEntryPoint).toBeCalled()
        expect(userInputService.resetCalculationUserInputForPrisoner).toBeCalledWith(expect.anything(), 'A1234AB')
      })
  })

  it('GET /calculation/:nomsId/complete should error if calculation is not confirmed', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationResults.mockResolvedValue({
      ...stubbedCalculationResults,
      calculationStatus: 'PRELIMINARY',
    })
    return request(app).get('/calculation/A1234AB/complete/123456').expect(404).expect('Content-Type', /html/)
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
        expect(res.text).toContain('Anon Nobody')
        expect(res.text).toMatch(/<script src="\/assets\/print.js"><\/script>/)
        expect(res.text).toMatch(/Calculation/)
      })
  })

  it('POST /calculation/:nomsId/summary/:calculationRequestId should redirect if an error is thrown', () => {
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
  it('POST /calculation/:nomsId/summary/:calculationRequestId should submit release dates', () => {
    calculateReleaseDatesService.confirmCalculation.mockResolvedValue({
      dates: {},
      calculationRequestId: 654321,
      effectiveSentenceLength: {},
      prisonerId: 'A1234AA',
      bookingId: 123,
      calculationStatus: 'PRELIMINARY',
    })
    return request(app)
      .post('/calculation/A1234AB/summary/123456')
      .expect(302)
      .expect('Location', '/calculation/A1234AB/complete/654321')
      .expect(res => {
        expect(res.redirect).toBeTruthy()
      })
  })
})

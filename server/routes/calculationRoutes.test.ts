import request from 'supertest'
import type { Express } from 'express'
import { HttpError } from 'http-errors'
import MockDate from 'mockdate'
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
  NonFridayReleaseDay,
  WorkingDay,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import EntryPointService from '../services/entryPointService'
import ReleaseDateWithAdjustments from '../@types/calculateReleaseDates/releaseDateWithAdjustments'
import UserInputService from '../services/userInputService'
import {
  ersedAdjustedByArdBreakdown,
  ersedAdjustedByArdReleaseDate,
  ersedBeforeCrdBeforeMtd,
  ersedBeforeMtdBeforeCrd,
  hdcedAdjustedToArd,
  hdcedAdjustedToArdReleaseDates,
  mtdBeforeHdcedAndCrd,
  mtdBeforePedAndCrd,
  mtdLaterThanArd,
  mtdLaterThanCrd,
  mtdLaterThanHdcedWithArd,
  mtdLaterThanHdcedWithCrd,
  mtdLaterThanPed,
  pedAdjustedByCrdAndBeforePrrdBreakdown,
  pedAdjustedByCrdAndBeforePrrdReleaseDates,
} from '../services/breakdownExamplesTestData'
import ViewReleaseDatesService from '../services/viewReleaseDatesService'
import config from '../config'

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
    ERSED: '2020-02-03',
  },
  calculationRequestId: 123456,
  effectiveSentenceLength: {},
  prisonerId: 'A1234AB',
  calculationStatus: 'CONFIRMED',
  calculationReference: 'ABC123',
  bookingId: 123,
  approvedDates: {},
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
const stubbedNoNonFridayReleaseAdjustments: { [key: string]: NonFridayReleaseDay } = {}
const stubbedNonFridayReleaseAdjustments: { [key: string]: NonFridayReleaseDay } = {
  CRD: {
    date: '2021-02-04',
    usePolicy: true,
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
    sentenceCalculationType: 'ADIMP',
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
    sentenceCalculationType: 'ADIMP',
    sentenceTypeDescription: 'SDS Standard Sentence',
    offences: [{ offenceEndDate: '2021-02-03', offenceCode: '123' }],
  } as PrisonApiOffenderSentenceAndOffences,
]

const stubbedDtoAndNonDto = [
  {
    terms: [
      {
        months: 4,
      },
    ],
    sentenceCalculationType: 'DTO',
    sentenceTypeDescription: 'Detention And Training Order Sentence',
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
    sentenceCalculationType: 'ADIMP',
    sentenceTypeDescription: 'SDS Standard Sentence',
    offences: [{ offenceEndDate: '2021-02-03', offenceCode: '123' }],
  } as PrisonApiOffenderSentenceAndOffences,
]

const stubbedErsedIneligibleSentencesAndOffences = [
  {
    sentenceSequence: 3,
    lineSequence: 3,
    caseSequence: 3,
    courtDescription: 'Preston Crown Court',
    sentenceStatus: 'A',
    sentenceCategory: '2020',
    sentenceCalculationType: 'LR_EDS18',
    sentenceTypeDescription: 'LR_EDS18',
    sentenceDate: '2021-09-03',
    terms: [
      {
        years: 0,
        months: 2,
        weeks: 0,
        days: 0,
      },
    ],
    offences: [
      {
        offenderChargeId: 1,
        offenceStartDate: '2020-01-01',
        offenceCode: 'RL05016',
        offenceDescription: 'Access / exit by unofficial route - railway bye-law',
      },
    ],
  },
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
    calculateReleaseDatesService.getNonFridayReleaseAdjustments.mockResolvedValue(stubbedNoNonFridayReleaseAdjustments)
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
        expect(res.text).toContain('CRD')
        expect(res.text).toContain('Conditional release date')
        expect(res.text).toContain('Wednesday, 03 February 2021')
        expect(res.text).toContain('Tuesday, 02 February 2021 when adjusted to a working day')
        expect(res.text).toContain('HDCED')
        expect(res.text).toContain('Home detention curfew eligibility date')
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
        expect(res.text).toContain(`Monday, 03 February 2020`)
        expect(res.text).toContain(`ERSED`)
        expect(res.text).toContain('Early removal scheme eligibility date')
      })
  })

  it('GET /calculation/:nomsId/summary/:calculationRequestId should show ERSED recall notification banner if recall only', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationResults.mockResolvedValue(stubbedCalculationResults)
    calculateReleaseDatesService.getWeekendAdjustments.mockResolvedValue(stubbedWeekendAdjustments)
    calculateReleaseDatesService.getNonFridayReleaseAdjustments.mockResolvedValue(stubbedNoNonFridayReleaseAdjustments)
    calculateReleaseDatesService.getBreakdown.mockResolvedValue({
      calculationBreakdown: stubbedCalculationBreakdown,
      releaseDatesWithAdjustments: stubbedReleaseDatesWithAdjustments,
    })
    viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedErsedIneligibleSentencesAndOffences)
    return request(app)
      .get('/calculation/A1234AB/summary/123456')
      .expect(200)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('Include an Early removal scheme eligibility date (ERSED) in this calculation')
        expect(res.text).toContain('Important')
        expect(res.text).toContain(
          'This service cannot calculate the ERSED if the person is serving a recall. If they are eligible for early removal, enter the ERSED in NOMIS.'
        )
      })
  })

  it('GET /calculation/:nomsId/summary/:calculationRequestId should return details about the ped adjusted release dates', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationResults.mockResolvedValue(pedAdjustedByCrdAndBeforePrrdReleaseDates())
    calculateReleaseDatesService.getWeekendAdjustments.mockResolvedValue(stubbedWeekendAdjustments)
    calculateReleaseDatesService.getNonFridayReleaseAdjustments.mockResolvedValue(stubbedNoNonFridayReleaseAdjustments)
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
        expect(res.text).toContain('PED adjusted for the CRD of a concurrent sentence or default term')
        expect(res.text).toContain(
          'The post recall release date (PRRD) of Tuesday, 18 March 2025 is later than the PED'
        )
        expect(res.text).not.toContain('Important')
        expect(res.text).not.toContain(
          'This service cannot calculate the ERSED if the person is serving a recall. If they are eligible for early removal, enter the ERSED in NOMIS.'
        )
      })
  })

  it('GET /calculation/:nomsId/summary/:calculationRequestId should return details about the hdced adjusted release dates', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationResults.mockResolvedValue(hdcedAdjustedToArdReleaseDates())
    calculateReleaseDatesService.getWeekendAdjustments.mockResolvedValue(stubbedWeekendAdjustments)
    calculateReleaseDatesService.getNonFridayReleaseAdjustments.mockResolvedValue(stubbedNoNonFridayReleaseAdjustments)
    calculateReleaseDatesService.getBreakdown.mockResolvedValue({
      calculationBreakdown: hdcedAdjustedToArd(),
      releaseDatesWithAdjustments: stubbedReleaseDatesWithAdjustments,
    })
    viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    return request(app)
      .get('/calculation/A1234AA/summary/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('HDCED adjusted for the ARD of a concurrent sentence or default term')
      })
  })

  it('GET /calculation/:nomsId/summary/:calculationRequestId should return details about the dto release date being later than the CRD', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationResults.mockResolvedValue(mtdLaterThanCrd())
    calculateReleaseDatesService.getWeekendAdjustments.mockResolvedValue(stubbedWeekendAdjustments)
    calculateReleaseDatesService.getNonFridayReleaseAdjustments.mockResolvedValue(stubbedNoNonFridayReleaseAdjustments)
    calculateReleaseDatesService.getBreakdown.mockResolvedValue({
      calculationBreakdown: stubbedCalculationBreakdown,
      releaseDatesWithAdjustments: stubbedReleaseDatesWithAdjustments,
    })
    viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedDtoAndNonDto)
    return request(app)
      .get('/calculation/A1234AA/summary/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          'The Detention and training order (DTO) release date is later than the Conditional Release Date (CRD)'
        )
      })
  })

  it('GET /calculation/:nomsId/summary/:calculationRequestId should return details about the dto release date being later than the ARD', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationResults.mockResolvedValue(mtdLaterThanArd())
    calculateReleaseDatesService.getWeekendAdjustments.mockResolvedValue(stubbedWeekendAdjustments)
    calculateReleaseDatesService.getNonFridayReleaseAdjustments.mockResolvedValue(stubbedNoNonFridayReleaseAdjustments)
    calculateReleaseDatesService.getBreakdown.mockResolvedValue({
      calculationBreakdown: stubbedCalculationBreakdown,
      releaseDatesWithAdjustments: stubbedReleaseDatesWithAdjustments,
    })
    viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedDtoAndNonDto)
    return request(app)
      .get('/calculation/A1234AA/summary/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          'The Detention and training order (DTO) release date is later than the Automatic Release Date (ARD)'
        )
      })
  })

  it('GET /calculation/:nomsId/summary/:calculationRequestId should return details about the dto release date being later than the PED', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationResults.mockResolvedValue(mtdLaterThanPed())
    calculateReleaseDatesService.getWeekendAdjustments.mockResolvedValue(stubbedWeekendAdjustments)
    calculateReleaseDatesService.getNonFridayReleaseAdjustments.mockResolvedValue(stubbedNoNonFridayReleaseAdjustments)
    calculateReleaseDatesService.getBreakdown.mockResolvedValue({
      calculationBreakdown: stubbedCalculationBreakdown,
      releaseDatesWithAdjustments: stubbedReleaseDatesWithAdjustments,
    })
    viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedDtoAndNonDto)
    return request(app)
      .get('/calculation/A1234AA/summary/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          'The Detention and training order (DTO) release date is later than the Parole Eligibility Date (PED)'
        )
      })
  })

  it('GET /calculation/:nomsId/summary/:calculationRequestId should return details about the dto release date being later than the HDCED', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationResults.mockResolvedValue(mtdLaterThanHdcedWithCrd())
    calculateReleaseDatesService.getWeekendAdjustments.mockResolvedValue(stubbedWeekendAdjustments)
    calculateReleaseDatesService.getNonFridayReleaseAdjustments.mockResolvedValue(stubbedNoNonFridayReleaseAdjustments)
    calculateReleaseDatesService.getBreakdown.mockResolvedValue({
      calculationBreakdown: stubbedCalculationBreakdown,
      releaseDatesWithAdjustments: stubbedReleaseDatesWithAdjustments,
    })
    viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedDtoAndNonDto)

    return request(app)
      .get('/calculation/A1234AA/summary/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          'The Detention and training order (DTO) release date is later than the Home detention curfew eligibility date (HDCED)'
        )
      })
  })

  it('GET /calculation/:nomsId/summary/:calculationRequestId should return details about the dto release date falls between the HDCED & CRD', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationResults.mockResolvedValue(mtdLaterThanHdcedWithCrd())
    calculateReleaseDatesService.getWeekendAdjustments.mockResolvedValue(stubbedWeekendAdjustments)
    calculateReleaseDatesService.getNonFridayReleaseAdjustments.mockResolvedValue(stubbedNoNonFridayReleaseAdjustments)
    calculateReleaseDatesService.getBreakdown.mockResolvedValue({
      calculationBreakdown: stubbedCalculationBreakdown,
      releaseDatesWithAdjustments: stubbedReleaseDatesWithAdjustments,
    })
    viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedDtoAndNonDto)

    return request(app)
      .get('/calculation/A1234AA/summary/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          'Release from Detention and training order (DTO) cannot happen until release from the sentence (earliest would be the Conditional release date)'
        )
      })
  })

  it('GET /calculation/:nomsId/summary/:calculationRequestId should return details about the dto release date falls between the HDCED & ARD', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationResults.mockResolvedValue(mtdLaterThanHdcedWithArd())
    calculateReleaseDatesService.getWeekendAdjustments.mockResolvedValue(stubbedWeekendAdjustments)
    calculateReleaseDatesService.getNonFridayReleaseAdjustments.mockResolvedValue(stubbedNoNonFridayReleaseAdjustments)
    calculateReleaseDatesService.getBreakdown.mockResolvedValue({
      calculationBreakdown: stubbedCalculationBreakdown,
      releaseDatesWithAdjustments: stubbedReleaseDatesWithAdjustments,
    })
    viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedDtoAndNonDto)

    return request(app)
      .get('/calculation/A1234AA/summary/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          'Release from Detention and training order (DTO) cannot happen until release from the sentence (earliest would be the Automatic release date)'
        )
      })
  })

  it('GET /calculation/:nomsId/summary/:calculationRequestId should return details about the dto release date falls before the HDCED & CRD/ARD', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationResults.mockResolvedValue(mtdBeforeHdcedAndCrd())
    calculateReleaseDatesService.getWeekendAdjustments.mockResolvedValue(stubbedWeekendAdjustments)
    calculateReleaseDatesService.getNonFridayReleaseAdjustments.mockResolvedValue(stubbedNoNonFridayReleaseAdjustments)
    calculateReleaseDatesService.getBreakdown.mockResolvedValue({
      calculationBreakdown: stubbedCalculationBreakdown,
      releaseDatesWithAdjustments: stubbedReleaseDatesWithAdjustments,
    })
    viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedDtoAndNonDto)

    return request(app)
      .get('/calculation/A1234AA/summary/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          'Release from the Detention and training order (DTO) cannot happen until release from the sentence (earliest would be the Home Detention Curfew Eligibility Date)'
        )
      })
  })

  it('GET /calculation/:nomsId/summary/:calculationRequestId should return details about the dto release date falls before the PED & CRD', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationResults.mockResolvedValue(mtdBeforePedAndCrd())
    calculateReleaseDatesService.getWeekendAdjustments.mockResolvedValue(stubbedWeekendAdjustments)
    calculateReleaseDatesService.getNonFridayReleaseAdjustments.mockResolvedValue(stubbedNoNonFridayReleaseAdjustments)
    calculateReleaseDatesService.getBreakdown.mockResolvedValue({
      calculationBreakdown: stubbedCalculationBreakdown,
      releaseDatesWithAdjustments: stubbedReleaseDatesWithAdjustments,
    })
    viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedDtoAndNonDto)

    return request(app)
      .get('/calculation/A1234AA/summary/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          'Release from Detention and training order (DTO) cannot happen until release from the sentence (earliest would be the Parole Eligibility Date)'
        )
      })
  })

  it('GET /calculation/:nomsId/summary/:calculationRequestId should return details about the ersed being adjusted to the MTD', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationResults.mockResolvedValue(ersedBeforeMtdBeforeCrd())
    calculateReleaseDatesService.getWeekendAdjustments.mockResolvedValue(stubbedWeekendAdjustments)
    calculateReleaseDatesService.getNonFridayReleaseAdjustments.mockResolvedValue(stubbedNoNonFridayReleaseAdjustments)
    calculateReleaseDatesService.getBreakdown.mockResolvedValue({
      calculationBreakdown: stubbedCalculationBreakdown,
      releaseDatesWithAdjustments: stubbedReleaseDatesWithAdjustments,
    })
    viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedDtoAndNonDto)

    return request(app)
      .get('/calculation/A1234AA/summary/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Adjusted to Mid term date (MTD) of the Detention and training order (DTO)')
      })
  })

  it('GET /calculation/:nomsId/summary/:calculationRequestId should display notification when ERSED cannot happen because of DTO', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationResults.mockResolvedValue(ersedBeforeCrdBeforeMtd())
    calculateReleaseDatesService.getWeekendAdjustments.mockResolvedValue(stubbedWeekendAdjustments)
    calculateReleaseDatesService.getNonFridayReleaseAdjustments.mockResolvedValue(stubbedNoNonFridayReleaseAdjustments)
    calculateReleaseDatesService.getBreakdown.mockResolvedValue({
      calculationBreakdown: stubbedCalculationBreakdown,
      releaseDatesWithAdjustments: stubbedReleaseDatesWithAdjustments,
    })
    viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedDtoAndNonDto)

    return request(app)
      .get('/calculation/A1234AA/summary/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          'Early removal cannot happen as release from the Detention Training Order (DTO) is later than the Conditional Release Date (CRD).'
        )
        expect(res.text).toContain('Important')
      })
  })
  it('GET /calculation/:nomsId/summary/:calculationRequestId should display upcoming HDCED changes notification', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationResults.mockResolvedValue(stubbedCalculationResults)
    calculateReleaseDatesService.getWeekendAdjustments.mockResolvedValue(stubbedWeekendAdjustments)
    calculateReleaseDatesService.getNonFridayReleaseAdjustments.mockResolvedValue(stubbedNoNonFridayReleaseAdjustments)
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
        expect(res.text).not.toContain('From 6 June, the policy for calculating HDCED has changed')
        expect(res.text).not.toContain('This service has calculated the HDCED using the new policy rules')
      })
  })

  it('GET /calculation/:nomsId/summary/:calculationRequestId should display HDCED changes notification', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationResults.mockResolvedValue(stubbedCalculationResults)
    calculateReleaseDatesService.getWeekendAdjustments.mockResolvedValue(stubbedWeekendAdjustments)
    calculateReleaseDatesService.getNonFridayReleaseAdjustments.mockResolvedValue(stubbedNoNonFridayReleaseAdjustments)
    calculateReleaseDatesService.getBreakdown.mockResolvedValue({
      calculationBreakdown: stubbedCalculationBreakdown,
      releaseDatesWithAdjustments: stubbedReleaseDatesWithAdjustments,
    })
    viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    MockDate.set('2023-06-06')
    return request(app)
      .get('/calculation/A1234AB/summary/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('This service has calculated the HDCED using the new policy rules.')
        expect(res.text).not.toContain('From 6 June, the policy for calculating HDCED has changed')
      })
  })

  it('GET /calculation/:nomsId/summary/:calculationRequestId should return details about the calculation requested with license recall', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationResults.mockResolvedValue(stubbedCalculationResults)
    calculateReleaseDatesService.getWeekendAdjustments.mockResolvedValue(stubbedWeekendAdjustments)
    calculateReleaseDatesService.getNonFridayReleaseAdjustments.mockResolvedValue(stubbedNoNonFridayReleaseAdjustments)
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

  it('GET /calculation/:nomsId/summary/:calculationRequestId should return details ERSED breakdown with ERSED adjusted by ARD', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationResults.mockResolvedValue(ersedAdjustedByArdReleaseDate())
    calculateReleaseDatesService.getWeekendAdjustments.mockResolvedValue(stubbedWeekendAdjustments)
    calculateReleaseDatesService.getNonFridayReleaseAdjustments.mockResolvedValue(stubbedNoNonFridayReleaseAdjustments)
    calculateReleaseDatesService.getBreakdown.mockResolvedValue({
      calculationBreakdown: ersedAdjustedByArdBreakdown(),
      releaseDatesWithAdjustments: stubbedReleaseDatesWithAdjustments,
    })
    viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    return request(app)
      .get('/calculation/A1234AA/summary/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('ERSED adjusted for the ARD of a concurrent default term')
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
  it('GET /calculation/:nomsId/summary should return save to nomis button if approved dates off', () => {
    config.featureToggles.approvedDates = false
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationResults.mockResolvedValue(ersedAdjustedByArdReleaseDate())
    calculateReleaseDatesService.getWeekendAdjustments.mockResolvedValue(stubbedWeekendAdjustments)
    calculateReleaseDatesService.getNonFridayReleaseAdjustments.mockResolvedValue(stubbedNoNonFridayReleaseAdjustments)
    calculateReleaseDatesService.getBreakdown.mockResolvedValue({
      calculationBreakdown: stubbedCalculationBreakdown,
      releaseDatesWithAdjustments: stubbedReleaseDatesWithAdjustments,
    })
    viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    return request(app)
      .get('/calculation/A1234AA/summary/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Confirm and submit')
      })
  })
  it('GET /calculation/:nomsId/summary should return confirm and continue button if approved dates on', () => {
    config.featureToggles.approvedDates = true
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationResults.mockResolvedValue(ersedAdjustedByArdReleaseDate())
    calculateReleaseDatesService.getWeekendAdjustments.mockResolvedValue(stubbedWeekendAdjustments)
    calculateReleaseDatesService.getNonFridayReleaseAdjustments.mockResolvedValue(stubbedNoNonFridayReleaseAdjustments)
    calculateReleaseDatesService.getBreakdown.mockResolvedValue({
      calculationBreakdown: stubbedCalculationBreakdown,
      releaseDatesWithAdjustments: stubbedReleaseDatesWithAdjustments,
    })
    viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    return request(app)
      .get('/calculation/A1234AA/summary/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Confirm and continue')
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
    calculateReleaseDatesService.getNonFridayReleaseAdjustments.mockResolvedValue(stubbedNoNonFridayReleaseAdjustments)
    return request(app)
      .get('/calculation/A1234AB/summary/123456/print')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Anon Nobody')
        expect(res.text).toMatch(/<script src="\/assets\/print.js"><\/script>/)
        expect(res.text).toMatch(/Dates for/)
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
      calculationReference: 'ABC123',
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
  it('GET /calculation/:nomsId/summary/:calculationRequestId with specialist support on should display help text', () => {
    config.featureToggles.specialistSupport = true
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationResults.mockResolvedValue(stubbedCalculationResults)
    calculateReleaseDatesService.getWeekendAdjustments.mockResolvedValue(stubbedWeekendAdjustments)
    calculateReleaseDatesService.getNonFridayReleaseAdjustments.mockResolvedValue(stubbedNoNonFridayReleaseAdjustments)
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
        expect(res.text).toContain('If you think the calculation is wrong')
        expect(res.text).toContain('contact the specialist')
        expect(res.text).toContain('support team')
      })
  })
  it('GET /calculation/:nomsId/summary/:calculationRequestId with non Friday release returns should display hint text', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationResults.mockResolvedValue(stubbedCalculationResults)
    calculateReleaseDatesService.getWeekendAdjustments.mockResolvedValue(stubbedWeekendAdjustments)
    calculateReleaseDatesService.getNonFridayReleaseAdjustments.mockResolvedValue(stubbedNonFridayReleaseAdjustments)
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
        expect(res.text).not.toContain('Tuesday, 02 February 2021 when adjusted to a working day')
        expect(res.text).toContain('The <a href="#">non-friday release policy</a> applies to this release date.')
      })
  })
})

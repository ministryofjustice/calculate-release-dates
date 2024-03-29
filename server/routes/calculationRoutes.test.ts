import request from 'supertest'
import type { Express } from 'express'
import { HttpError } from 'http-errors'
import MockDate from 'mockdate'
import { appWithAllRoutes } from './testutils/appSetup'
import PrisonerService from '../services/prisonerService'
import UserService from '../services/userService'
import {
  PrisonAPIAssignedLivingUnit,
  PrisonApiPrisoner,
  PrisonApiSentenceDetail,
} from '../@types/prisonApi/prisonClientTypes'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import {
  BookingCalculation,
  CalculationBreakdown,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ReleaseDateWithAdjustments from '../@types/calculateReleaseDates/releaseDateWithAdjustments'
import UserInputService from '../services/userInputService'
import { pedAdjustedByCrdAndBeforePrrdBreakdown } from '../services/breakdownExamplesTestData'
import ViewReleaseDatesService from '../services/viewReleaseDatesService'
import config from '../config'
import { expectMiniProfile } from './testutils/layoutExpectations'
import { ResultsWithBreakdownAndAdjustments } from '../@types/calculateReleaseDates/rulesWithExtraAdjustments'

jest.mock('../services/userService')
jest.mock('../services/calculateReleaseDatesService')
jest.mock('../services/prisonerService')
jest.mock('../services/userInputService')
jest.mock('../services/viewReleaseDatesService')

const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const userService = new UserService(null, prisonerService) as jest.Mocked<UserService>
const calculateReleaseDatesService = new CalculateReleaseDatesService() as jest.Mocked<CalculateReleaseDatesService>
const userInputService = new UserInputService() as jest.Mocked<UserInputService>
const viewReleaseDatesService = new ViewReleaseDatesService() as jest.Mocked<ViewReleaseDatesService>

let app: Express

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
  calculationType: 'CALCULATED',
  bookingId: 123,
  approvedDates: {},
} as BookingCalculation

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

const stubbedReleaseDatesWithAdjustments: ReleaseDateWithAdjustments[] = [
  {
    releaseDateType: 'CRD',
    releaseDate: '2021-02-03',
    hintText: '15 January 2021 minus 18 days',
  },
  {
    releaseDateType: 'HDCED',
    releaseDate: '2029-05-13',
    hintText: '14 May 2029 minus 1 day',
  },
]

const stubbedErsedIneligibleSentencesAndOffences = [
  {
    bookingId: 1,
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
        code: 'IMP',
      },
    ],
    offences: [
      {
        offenderChargeId: 1,
        offenceStartDate: '2020-01-01',
        offenceCode: 'RL05016',
        offenceDescription: 'Access / exit by unofficial route - railway bye-law',
        indicators: [],
        isPcscSds: false,
        isPcscSdsPlus: false,
        isPcscSec250: false,
        isScheduleFifteenMaximumLife: false,
      },
    ],
  },
]
const stubbedResultsWithBreakdownAndAdjustments: ResultsWithBreakdownAndAdjustments = {
  context: {
    calculationRequestId: stubbedCalculationResults.calculationRequestId,
    prisonerId: stubbedCalculationResults.prisonerId,
    bookingId: stubbedCalculationResults.bookingId,
    calculationDate: stubbedCalculationResults.calculationDate,
    calculationStatus: stubbedCalculationResults.calculationStatus,
    calculationReference: stubbedCalculationResults.calculationReference,
    calculationType: stubbedCalculationResults.calculationType,
    calculationReason: stubbedCalculationResults.calculationReason,
    otherReasonDescription: stubbedCalculationResults.otherReasonDescription,
  },
  dates: {
    CRD: {
      date: '2021-02-03',
      type: 'CRD',
      description: 'Conditional release date',
      hints: [{ text: 'Tuesday, 02 February 2021 when adjusted to a working day' }],
    },
    SED: { date: '2021-02-03', type: 'SED', description: 'Sentence expiry date', hints: [] },
    HDCED: {
      date: '2021-10-03',
      type: 'HDCED',
      description: 'Home detention curfew eligibility date',
      hints: [{ text: 'Tuesday, 05 October 2021 when adjusted to a working day' }],
    },
    ERSED: { date: '2020-02-03', type: 'ERSED', description: 'Early removal scheme eligibility date', hints: [] },
  },
  calculationBreakdown: stubbedCalculationBreakdown,
  releaseDatesWithAdjustments: stubbedReleaseDatesWithAdjustments,
  calculationOriginalData: {
    prisonerDetails: {
      firstName: stubbedPrisonerData.firstName,
      lastName: stubbedPrisonerData.lastName,
      bookingId: stubbedPrisonerData.bookingId,
      agencyId: stubbedPrisonerData.agencyId,
      offenderNo: stubbedPrisonerData.offenderNo,
      dateOfBirth: stubbedPrisonerData.dateOfBirth,
      assignedLivingUnit: {
        agencyId: stubbedPrisonerData?.assignedLivingUnit?.agencyId,
        agencyName: stubbedPrisonerData?.assignedLivingUnit?.agencyName,
        description: stubbedPrisonerData?.assignedLivingUnit?.description,
        locationId: stubbedPrisonerData?.assignedLivingUnit?.locationId,
      },
      alerts: [],
    },
    sentencesAndOffences: [
      {
        bookingId: 1,
        sentenceStatus: '',
        sentenceCategory: '',
        sentenceDate: '2021-02-03',
        terms: [
          {
            years: 3,
            months: 0,
            weeks: 0,
            days: 0,
            code: 'IMP',
          },
        ],
        sentenceCalculationType: 'ADIMP',
        sentenceTypeDescription: 'SDS Standard Sentence',
        caseSequence: 1,
        lineSequence: 1,
        sentenceSequence: 1,
        offences: [
          {
            offenderChargeId: 1,
            offenceEndDate: '2021-02-03',
            offenceCode: '123',
            offenceDescription: '',
            indicators: [],
            isPcscSds: false,
            isPcscSdsPlus: false,
            isPcscSec250: false,
            isScheduleFifteenMaximumLife: false,
          },
          {
            offenderChargeId: 2,
            offenceStartDate: '2021-01-04',
            offenceEndDate: '2021-01-05',
            offenceCode: '123',
            offenceDescription: '',
            indicators: [],
            isPcscSds: false,
            isPcscSdsPlus: false,
            isPcscSec250: false,
            isScheduleFifteenMaximumLife: false,
          },
          {
            offenderChargeId: 3,
            offenceStartDate: '2021-03-06',
            offenceCode: '123',
            offenceDescription: '',
            indicators: [],
            isPcscSds: false,
            isPcscSdsPlus: false,
            isPcscSec250: false,
            isScheduleFifteenMaximumLife: false,
          },
          {
            offenderChargeId: 4,
            offenceStartDate: '2021-01-07',
            offenceEndDate: '2021-01-07',
            offenceCode: '123',
            offenceDescription: '',
            indicators: [],
            isPcscSds: false,
            isPcscSdsPlus: false,
            isPcscSec250: false,
            isScheduleFifteenMaximumLife: false,
          },
        ],
      },
      {
        bookingId: 1,
        sentenceStatus: '',
        sentenceCategory: '',
        sentenceDate: '2021-02-03',
        terms: [
          {
            years: 2,
            months: 0,
            weeks: 0,
            days: 0,
            code: 'IMP',
          },
        ],
        caseSequence: 2,
        lineSequence: 2,
        sentenceSequence: 2,
        consecutiveToSequence: 1,
        sentenceCalculationType: 'ADIMP',
        sentenceTypeDescription: 'SDS Standard Sentence',
        offences: [
          {
            offenderChargeId: 5,
            offenceEndDate: '2021-02-03',
            offenceCode: '123',
            offenceDescription: '',
            indicators: [],
            isPcscSds: false,
            isPcscSdsPlus: false,
            isPcscSec250: false,
            isScheduleFifteenMaximumLife: false,
          },
        ],
      },
    ],
  },
  approvedDates: {},
}

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      userService,
      prisonerService,
      calculateReleaseDatesService,
      userInputService,
      viewReleaseDatesService,
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Calculation routes tests', () => {
  it('GET /calculation/:nomsId/summary/:calculationRequestId should return details about the calculation requested', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue(
      stubbedResultsWithBreakdownAndAdjustments,
    )
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
          `Some release dates and details are not included because they are not relevant to this person's sentences`,
        )
        expect(res.text).toContain(`Monday, 03 February 2020`)
        expect(res.text).toContain(`ERSED`)
        expect(res.text).toContain('Early removal scheme eligibility date')
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })

  it('GET /calculation/:nomsId/summary/:calculationRequestId should show ERSED recall notification banner if recall only', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue({
      ...stubbedResultsWithBreakdownAndAdjustments,
      calculationOriginalData: {
        ...stubbedResultsWithBreakdownAndAdjustments,
        sentencesAndOffences: stubbedErsedIneligibleSentencesAndOffences,
      },
    })
    return request(app)
      .get('/calculation/A1234AB/summary/123456')
      .expect(200)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('Include an Early removal scheme eligibility date (ERSED) in this calculation')
        expect(res.text).toContain('Important')
        expect(res.text).toContain(
          'This service cannot calculate the ERSED if the person is serving a recall. If they are eligible for early removal, enter the ERSED in NOMIS.',
        )
      })
  })
  it('GET /calculation/:nomsId/summary/:calculationRequestId should not blow up if breakdown is missing', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue({
      ...stubbedResultsWithBreakdownAndAdjustments,
      calculationBreakdown: undefined,
      releaseDatesWithAdjustments: undefined,
      breakdownMissingReason: 'UNSUPPORTED_CALCULATION_BREAKDOWN',
    })

    return request(app)
      .get('/calculation/A1234AB/summary/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('CRD')
        expect(res.text).toContain('Conditional release date')
        expect(res.text).toContain('Wednesday, 03 February 2021')
        expect(res.text).toContain('Tuesday, 02 February 2021 when adjusted to a working day')
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })
  it('GET /calculation/:nomsId/summary/:calculationRequestId should show hints generated by the API', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue({
      ...stubbedResultsWithBreakdownAndAdjustments,
      context: { ...stubbedResultsWithBreakdownAndAdjustments.context, prisonerId: 'A1234AA' },
      calculationBreakdown: pedAdjustedByCrdAndBeforePrrdBreakdown(),
      dates: {
        SLED: { date: '2029-09-14', type: 'SLED', description: 'Sentence and licence expiry date', hints: [] },
        CRD: { date: '2026-09-14', type: 'CRD', description: 'Conditional release date', hints: [] },
        PED: {
          date: '2024-10-12',
          type: 'PED',
          description: 'Parole eligibility date',
          hints: [
            { text: 'PED adjusted for the CRD of a concurrent sentence or default term' },
            { text: 'The post recall release date (PRRD) of Tuesday, 18 March 2025 is later than the PED' },
          ],
        },
        ESED: { date: '2029-09-14', type: 'ESED', description: 'Effective sentence end date', hints: [] },
      },
    })
    return request(app)
      .get('/calculation/A1234AA/summary/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('PED adjusted for the CRD of a concurrent sentence or default term')
        expect(res.text).toContain(
          'The post recall release date (PRRD) of Tuesday, 18 March 2025 is later than the PED',
        )
        expect(res.text).not.toContain('Important')
        expect(res.text).not.toContain(
          'This service cannot calculate the ERSED if the person is serving a recall. If they are eligible for early removal, enter the ERSED in NOMIS.',
        )
      })
  })

  it('GET /calculation/:nomsId/summary/:calculationRequestId should display notification when ERSED cannot happen because of DTO', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue({
      ...stubbedResultsWithBreakdownAndAdjustments,
      context: { ...stubbedResultsWithBreakdownAndAdjustments.context, prisonerId: 'A1234AA' },
      dates: {
        SLED: { date: '2023-09-20', type: 'SLED', description: 'Sentence and licence expiry date', hints: [] },
        MTD: { date: '2024-12-20', type: 'MTD', description: 'Mid transfer date', hints: [] },
        ERSED: { date: '2021-12-20', type: 'ERSED', description: 'Early removal scheme eligibility date', hints: [] },
        CRD: { date: '2022-08-14', type: 'CRD', description: 'Conditional release date', hints: [] },
        ESED: { date: '2023-09-20', type: 'ESED', description: 'Effective sentence end date', hints: [] },
      },
    })

    return request(app)
      .get('/calculation/A1234AA/summary/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          'Early removal cannot happen as release from the Detention Training Order (DTO) is later than the Conditional Release Date (CRD).',
        )
        expect(res.text).toContain('Important')
      })
  })
  it('GET /calculation/:nomsId/summary/:calculationRequestId should display upcoming HDCED changes notification', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue(
      stubbedResultsWithBreakdownAndAdjustments,
    )
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
    calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue(
      stubbedResultsWithBreakdownAndAdjustments,
    )
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

  it('GET /calculation/:nomsId/complete should return details about the calculation requested', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationResults.mockResolvedValue(stubbedCalculationResults)
    return request(app)
      .get('/calculation/A1234AB/complete/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toMatch(/Release dates saved to NOMIS for<br>\s*Anon Nobody/)
        expect(res.text).toContain('Back to Digital Prison Service (DPS) search')
        expect(userInputService.resetCalculationUserInputForPrisoner).toBeCalledWith(expect.anything(), 'A1234AB')
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })
  it('GET /calculation/:nomsId/summary should return confirm and continue button if approved dates on', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue({
      ...stubbedResultsWithBreakdownAndAdjustments,
      context: { ...stubbedResultsWithBreakdownAndAdjustments.context, prisonerId: 'A1234AA' },
    })
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
    calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue(
      stubbedResultsWithBreakdownAndAdjustments,
    )
    return request(app)
      .get('/calculation/A1234AB/summary/123456/print')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Anon Nobody')
        expect(res.text).toMatch(/<script src="\/assets\/print.js"><\/script>/)
        expect(res.text).toMatch(/Dates for/)
        expectMiniProfile(res.text, expectedMiniProfile)
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
      calculationType: 'CALCULATED',
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
    calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue(
      stubbedResultsWithBreakdownAndAdjustments,
    )
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
})

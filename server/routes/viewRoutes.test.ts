import request from 'supertest'
import type { Express } from 'express'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import PrisonerService from '../services/prisonerService'
import UserService from '../services/userService'
import {
  AnalyzedPrisonApiBookingAndSentenceAdjustments,
  PrisonAPIAssignedLivingUnit,
  PrisonApiPrisoner,
  PrisonApiSentenceDetail,
} from '../@types/prisonApi/prisonClientTypes'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import ViewReleaseDatesService from '../services/viewReleaseDatesService'
import {
  BookingCalculation,
  CalculationBreakdown,
  CalculationSentenceUserInput,
  CalculationUserInputs,
  GenuineOverrideRequest,
  SentenceAndOffencesWithReleaseArrangements,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ReleaseDateWithAdjustments from '../@types/calculateReleaseDates/releaseDateWithAdjustments'
import { expectMiniProfile, expectNoMiniProfile } from './testutils/layoutExpectations'
import { ResultsWithBreakdownAndAdjustments } from '../@types/calculateReleaseDates/rulesWithExtraAdjustments'

jest.mock('../services/userService')
jest.mock('../services/calculateReleaseDatesService')
jest.mock('../services/prisonerService')
jest.mock('../services/viewReleaseDatesService')

const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const userService = new UserService(null, prisonerService) as jest.Mocked<UserService>
const calculateReleaseDatesService = new CalculateReleaseDatesService() as jest.Mocked<CalculateReleaseDatesService>
const viewReleaseDatesService = new ViewReleaseDatesService() as jest.Mocked<ViewReleaseDatesService>

let app: Express

const pastNomisCalculation = {
  calculatedAt: '2022-01-01T00:00:00Z',
  reason: 'Some reason',
  comment: null,
  releaseDates: [
    {
      type: 'HDCED',
      description: 'Home detention curfew eligibility date',
      date: '2024-05-12',
      hints: [
        {
          text: 'Friday, 10 May 2024 when adjusted to a working day',
          link: null,
        },
      ],
    },
  ],
}

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
    isSDSPlus: false,
  } as SentenceAndOffencesWithReleaseArrangements,
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
    offences: [{ offenceEndDate: '2021-02-03', offenceCode: '123', offenceDescription: 'Doing a crime' }],
    isSDSPlus: false,
  } as SentenceAndOffencesWithReleaseArrangements,
]

const stubbedAdjustments = {
  sentenceAdjustments: [
    {
      sentenceSequence: 1,
      type: 'UNUSED_REMAND',
      numberOfDays: 2,
      fromDate: '2021-02-01',
      toDate: '2021-02-02',
      active: true,
    },
  ],
  bookingAdjustments: [
    {
      type: 'RESTORED_ADDITIONAL_DAYS_AWARDED',
      numberOfDays: 2,
      fromDate: '2021-03-07',
      toDate: '2021-03-08',
      active: true,
    },
  ],
} as AnalyzedPrisonApiBookingAndSentenceAdjustments

const stubbedCalculationResults = {
  dates: {
    CRD: '2021-02-03',
    SED: '2021-02-03',
    HDCED: '2021-10-03',
  },
  calculationRequestId: 123456,
  effectiveSentenceLength: {},
  prisonerId: 'A1234AA',
  calculationReference: 'ABC123',
  bookingId: 123,
  calculationStatus: 'CONFIRMED',
  calculationType: 'CALCULATED',
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
const stubbedUserInput = {
  calculateErsed: true,
  sentenceCalculationUserInputs: [
    {
      userInputType: 'ORIGINAL',
      userChoice: true,
      offenceCode: '123',
      sentenceSequence: 2,
    } as CalculationSentenceUserInput,
  ],
} as CalculationUserInputs

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
      viewReleaseDatesService,
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('View journey routes tests', () => {
  describe('Get nomis calculation summary view tests', () => {
    it('GET /view/:nomsId/nomis-calculation-summary/:offenderSentCalculationId should have the correct details', () => {
      prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      calculateReleaseDatesService.getNomisCalculationSummary.mockResolvedValue(pastNomisCalculation as never)
      return request(app)
        .get('/view/A1234AA/nomis-calculation-summary/-1')
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-qa=prisoner-name]').text()).toStrictEqual('Release dates for Anon Nobody')
          expect($('[data-qa=calculation-date]').text()).toStrictEqual('01 January 2022')
          expect($('[data-qa=calculation-reason]').text()).toStrictEqual('Some reason')
          expect($('[data-qa=calculation-source]').text()).toStrictEqual('NOMIS')
          expect($('[data-qa=release-dates-title]').text()).toStrictEqual('Release dates')
          expect($('[data-qa=calculation-date-title]').text()).toStrictEqual('Date of calculation')
          expect($('[data-qa=calculation-reason-title]').text()).toStrictEqual('Calculation reason')
          expect($('[data-qa=calculation-source-title]').text()).toStrictEqual('Source')
          expect($('[data-qa=calculation-details-title]').text()).toStrictEqual('Calculation details')
          expect($('[data-qa=HDCED-date]').text().trim()).toContain('Sunday, 12 May 2024')
          expect($('[data-qa=HDCED-short-name]').text().trim()).toContain('HDCED')
          expect($('[data-qa=HDCED-full-name]').text().trim()).toStrictEqual('Home detention curfew eligibility date')
          expect($('[data-qa=mini-profile-prisoner-number]').text().trim()).toStrictEqual('A1234AA')
          expect($('[data-qa=HDCED-release-date-hint-0]').text()).toStrictEqual(
            'Friday, 10 May 2024 when adjusted to a working day',
          )
        })
    })
  })

  describe('Get latest view tests', () => {
    it('GET /view/:nomsId/latest should redirect to the latest ', () => {
      prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      viewReleaseDatesService.getLatestCalculation.mockResolvedValue(stubbedCalculationResults as never)
      return request(app)
        .get('/view/A1234AA/latest')
        .expect(302)
        .expect('Location', '/view/A1234AA/sentences-and-offences/123456')
        .expect(res => {
          expect(res.redirect).toBeTruthy()
        })
    })

    it('GET /view/:nomsId/latest should redirect to the error page if no calculation was found ', () => {
      prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      viewReleaseDatesService.getLatestCalculation.mockRejectedValue({ status: 404 })
      return request(app)
        .get('/view/A1234AA/latest')
        .expect(404)
        .expect(res => {
          expect(res.text).toContain('have not been submitted using the Calculate release dates')
          expect(res.text).toContain('/calculation/A1234AA/reason')
        })
    })
  })

  describe('View sentence and offences tests', () => {
    it('GET /view/:calculationRequestId/sentences-and-offences should return detail about the sentences and offences of the calculation', () => {
      viewReleaseDatesService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
      viewReleaseDatesService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedAdjustments)
      viewReleaseDatesService.getCalculationUserInputs.mockResolvedValue(stubbedUserInput)
      return request(app)
        .get('/view/A1234AA/sentences-and-offences/123456')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-qa=123-title]').text()).toStrictEqual('123 - Doing a crime')
          expect(res.text).toContain('A1234AA')
          expect(res.text).toContain('Anon')
          expect(res.text).toContain('Nobody')
          expect(res.text).toContain('This calculation will include 6')
          expect(res.text).toContain('sentences from NOMIS.')
          expect(res.text).toContain('Court case 1')
          expect(res.text).toContain('Committed on 03 February 2021')
          expect(res.text).toContain('Committed from 04 January 2021 to 05 January 2021')
          expect(res.text).toContain('Committed on 06 March 2021')
          expect(res.text).toContain('Offence date not entered')
          expect(res.text).toContain('Committed on 07 January 2021')
          expect(res.text).toContain('SDS Standard Sentence')
          expect(res.text).toContain('Court case 2')
          expect(res.text).toContain('Consecutive to  court case 1 count 1')
          expect(res.text).toContain('/view/A1234AA/calculation-summary/123456')
          expect(res.text).toContain('SDS+')
          expect(res.text).not.toContain('Include an Early removal scheme eligibility date (ERSED) in this calculation')
          expect(res.text).toContain(
            'An Early removal scheme eligibility date (ERSED) was included in this calculation',
          )
          expectMiniProfile(res.text, expectedMiniProfile)
        })
    })
    it('GET /view/:calculationRequestId/sentences-and-offences should return SDS+ badge if sentence is marked as SDS+', () => {
      viewReleaseDatesService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue([
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
          isSDSPlus: true,
        } as SentenceAndOffencesWithReleaseArrangements,
      ])
      viewReleaseDatesService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedAdjustments)
      viewReleaseDatesService.getCalculationUserInputs.mockResolvedValue({
        calculateErsed: true,
        sentenceCalculationUserInputs: [],
      } as CalculationUserInputs)
      return request(app)
        .get('/view/A1234AA/sentences-and-offences/123456')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.moj-badge.moj-badge--small:contains("SDS+")')).toHaveLength(1)
        })
    })
    it('GET /view/:calculationRequestId/sentences-and-offences should return SDS+ badge if user marked sentence as SDS+', () => {
      viewReleaseDatesService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue([
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
          isSDSPlus: false,
        } as SentenceAndOffencesWithReleaseArrangements,
      ])
      viewReleaseDatesService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedAdjustments)
      viewReleaseDatesService.getCalculationUserInputs.mockResolvedValue({
        calculateErsed: true,
        sentenceCalculationUserInputs: [
          {
            userInputType: 'ORIGINAL',
            userChoice: true,
            offenceCode: '123',
            sentenceSequence: 2,
          } as CalculationSentenceUserInput,
        ],
      } as CalculationUserInputs)
      return request(app)
        .get('/view/A1234AA/sentences-and-offences/123456')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.moj-badge.moj-badge--small:contains("SDS+")')).toHaveLength(1)
        })
    })
    it('GET /view/:calculationRequestId/sentences-and-offences should return detail about the sentences and offences without ERSED', () => {
      viewReleaseDatesService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
      viewReleaseDatesService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedAdjustments)
      viewReleaseDatesService.getCalculationUserInputs.mockResolvedValue({ ...stubbedUserInput, calculateErsed: false })
      return request(app)
        .get('/view/A1234AA/sentences-and-offences/123456')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).not.toContain('Include an Early removal scheme eligibility date (ERSED) in this calculation')
          expect(res.text).not.toContain(
            'An Early removal scheme eligibility date (ERSED) was included in this calculation',
          )
        })
    })
    it('GET /view/:calculationRequestId/sentences-and-offences should return detail about the sentences and offences of the calculation if there is no user inputs', () => {
      viewReleaseDatesService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
      viewReleaseDatesService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedAdjustments)
      viewReleaseDatesService.getCalculationUserInputs.mockResolvedValue({
        calculateErsed: false,
        useOffenceIndicators: false,
        sentenceCalculationUserInputs: [],
      })
      return request(app)
        .get('/view/A1234AA/sentences-and-offences/123456')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).not.toContain('SDS+')
        })
    })
  })

  describe('View calculation tests', () => {
    it('GET /view/:nomsId/calculation-summary/:calculationRequestId should return detail about the the calculation', () => {
      calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue(
        stubbedResultsWithBreakdownAndAdjustments,
      )
      prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      return request(app)
        .get('/view/A1234AA/calculation-summary/123456')
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
          expect(res.text).not.toContain('Reason')
          expect(res.text).not.toContain('A calculation reason')
          expect(res.text).not.toContain('13 January 2024')
          expectMiniProfile(res.text, expectedMiniProfile)
        })
    })

    it('GET /view/:calculationRequestId/calculation-summary/print should return a printable page about the calculation requested', () => {
      calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue(
        stubbedResultsWithBreakdownAndAdjustments,
      )
      prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      return request(app)
        .get('/view/A1234AA/calculation-summary/123456/print')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Anon Nobody')
          expect(res.text).toMatch(/<script src="\/assets\/print.js"><\/script>/)
          expect(res.text).toMatch(/Calculation/)
          expectMiniProfile(res.text, expectedMiniProfile)
        })
    })

    it('GET /view/:nomsId/calculation-summary/:calculationRequestId should display results even if prison-api data is not available', () => {
      calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue({
        ...stubbedResultsWithBreakdownAndAdjustments,
        calculationOriginalData: {
          prisonerDetails: undefined,
          sentencesAndOffences: undefined,
        },
        calculationBreakdown: undefined,
        breakdownMissingReason: 'PRISON_API_DATA_MISSING',
      })
      return request(app)
        .get('/view/A1234AA/calculation-summary/123456')
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
          // Should not contain breakdown
          expect(res.text).not.toContain('Calculation breakdown')
          expect(res.text).toContain('The calculation breakdown cannot be shown on this page.')
          expect(res.text).toContain(
            'To view the sentence and offence information and the calculation breakdown, you will need to <a href="/calculation/A1234AA/reason">calculate release dates again.',
          )
          expectNoMiniProfile(res.text)
        })
    })

    it('GET /view/:nomsId/calculation-summary/:calculationRequestId for a genuine override should display the other reason', () => {
      calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue(
        stubbedResultsWithBreakdownAndAdjustments,
      )
      calculateReleaseDatesService.getGenuineOverride.mockResolvedValue({
        reason: 'Other: reason',
        savedCalculation: '123',
        originalCalculationRequest: '456',
        isOverridden: true,
      } as GenuineOverrideRequest)
      return request(app)
        .get('/view/A1234AA/calculation-summary/123456')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain(
            'These dates have been manually entered by the Specialist support team because reason',
          )
        })
    })

    it('GET /view/:nomsId/calculation-summary/:calculationRequestId for a genuine override should look up reason', () => {
      calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue(
        stubbedResultsWithBreakdownAndAdjustments,
      )
      calculateReleaseDatesService.getGenuineOverride.mockResolvedValue({
        reason: 'terror',
        savedCalculation: '123',
        originalCalculationRequest: '456',
        isOverridden: true,
      } as GenuineOverrideRequest)
      return request(app)
        .get('/view/A1234AA/calculation-summary/123456')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain(
            'These dates have been manually entered by the Specialist support team because of terrorism or terror-related offences',
          )
        })
    })
    it('GET /view/:nomsId/calculation-summary/:calculationRequestId should display the reason', () => {
      calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue({
        ...stubbedResultsWithBreakdownAndAdjustments,
        context: {
          ...stubbedResultsWithBreakdownAndAdjustments.context,
          calculationDate: '2024-01-13',
          calculationReason: { id: 1, displayName: 'A calculation reason', isOther: false },
        },
      })

      return request(app)
        .get('/view/A1234AA/calculation-summary/123456')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Reason')
          expect(res.text).toContain('A calculation reason')
          expect(res.text).toContain('13 January 2024')
        })
    })
    it('GET /view/:nomsId/calculation-summary/:calculationRequestId should display a back to view sentence and offences link', () => {
      calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue(
        stubbedResultsWithBreakdownAndAdjustments,
      )

      return request(app)
        .get('/view/A1234AA/calculation-summary/123456')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-qa=previous-page-button]').first().attr('href')).toStrictEqual(
            '/view/A1234AA/sentences-and-offences/123456',
          )
        })
    })
    it('GET /view/:nomsId/calculation-summary/:calculationRequestId should display a back to DPS search link', () => {
      calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue(
        stubbedResultsWithBreakdownAndAdjustments,
      )

      return request(app)
        .get('/view/A1234AA/calculation-summary/123456')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const backToDpsLink = $('[data-qa=back-to-dps-search-link]').first()
          expect(backToDpsLink.length).toStrictEqual(1)
          expect(backToDpsLink.text()).toStrictEqual('Back to Digital Prison Service (DPS) search')
          expect(backToDpsLink.attr('href')).toStrictEqual('http://localhost:3000/dps')
        })
    })
    it('GET /view/:calculationRequestId/calculation-summary should display the other reason if it was selected', () => {
      calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue({
        ...stubbedResultsWithBreakdownAndAdjustments,
        context: {
          ...stubbedResultsWithBreakdownAndAdjustments.context,
          calculationDate: '2024-01-19',
          calculationReason: { id: 2, displayName: 'Other', isOther: true },
          otherReasonDescription: 'Another reason for calculation',
        },
      })

      return request(app)
        .get('/view/A1234AA/calculation-summary/123456')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Reason')
          expect(res.text).toContain('Other (Another reason for calculation)')
          expect(res.text).toContain('19 January 2024')
        })
    })
    it('GET /view/:calculationRequestId/calculation-summary should include recall only notification banner', () => {
      const detailedCalResultWIthNotificationBannerSentencesAndOffences = {
        ...stubbedResultsWithBreakdownAndAdjustments,
        calculationOriginalData: {
          ...stubbedResultsWithBreakdownAndAdjustments,
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
              sentenceCalculationType: 'LR_EDS18',
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
                  offenderChargeId: 3,
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
          ],
        },
      }
      calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue(
        detailedCalResultWIthNotificationBannerSentencesAndOffences,
      )

      return request(app)
        .get('/view/A1234AA/calculation-summary/123456')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Important')
          expect(res.text).toContain(
            'This service cannot calculate the ERSED if the person is serving a recall. If they are eligible for early removal, enter the ERSED in NOMIS.',
          )
        })
    })
    it('GET /view/:calculationRequestId/calculation-summary should not show the ERSED warning banner if no recall only', () => {
      const detailedCalResultWIthNotificationBannerSentencesAndOffences = {
        ...stubbedResultsWithBreakdownAndAdjustments,
        sentencesAndOffences: [
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
            sentenceCalculationType: 'LR_EDS18',
            sentenceTypeDescription: 'SDS Standard Sentence',
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
            sentenceCalculationType: 'EDS18',
            sentenceTypeDescription: 'SDS Standard Sentence',
            offences: [
              {
                offenderChargeId: 2,
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
      }
      calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue(
        detailedCalResultWIthNotificationBannerSentencesAndOffences,
      )
      return request(app)
        .get('/view/A1234AA/calculation-summary/123456')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).not.toContain('Important')
          expect(res.text).not.toContain(
            'This service cannot calculate the ERSED if the person is serving a recall. If they are eligible for early removal, enter the ERSED in NOMIS.',
          )
        })
    })
  })
})

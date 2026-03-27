import type { Express } from 'express'
import request from 'supertest'
import PrisonerService from '../../services/prisonerService'
import UserService from '../../services/userService'
import ViewReleaseDatesService from '../../services/viewReleaseDatesService'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import {
  PrisonAPIAssignedLivingUnit,
  PrisonApiPrisoner,
  PrisonApiSentenceDetail,
} from '../../@types/prisonApi/prisonClientTypes'
import {
  BookingCalculation,
  CalculationBreakdown,
} from '../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ReleaseDateWithAdjustments from '../../@types/calculateReleaseDates/releaseDateWithAdjustments'
import { ResultsWithBreakdownAndAdjustments } from '../../@types/calculateReleaseDates/rulesWithExtraAdjustments'
import { appWithAllRoutes } from '../testutils/appSetup'
import { expectMiniProfile } from '../testutils/layoutExpectations'

jest.mock('../../services/prisonerService')
jest.mock('../../services/viewReleaseDatesService')
jest.mock('../../services/calculateReleaseDatesService')

const prisonerService = new PrisonerService(null, null) as jest.Mocked<PrisonerService>
new UserService(null, prisonerService) as jest.Mocked<UserService>
const viewReleaseDatesService = new ViewReleaseDatesService(null) as jest.Mocked<ViewReleaseDatesService>
const calculateReleaseDatesService = new CalculateReleaseDatesService(
  null,
  null,
) as jest.Mocked<CalculateReleaseDatesService>

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

const stubbedCalculationResults = {
  dates: {
    CRD: '2021-02-03',
    SED: '2021-02-03',
    HDCED: '2021-10-03',
  },
  calculationDate: '2020-06-01',
  calculationRequestId: 123456,
  effectiveSentenceLength: null,
  prisonerId: 'A1234AA',
  calculationReference: 'ABC123',
  bookingId: 123,
  calculationStatus: 'CONFIRMED',
  calculationType: 'CALCULATED',
  approvedDates: {},
  calculationReason: {
    id: 1,
    displayName: 'A calculation reason',
    isOther: false,
    useForApprovedDates: false,
    requiresFurtherDetail: false,
  },
} as BookingCalculation

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

const stubbedCalculationBreakdown: CalculationBreakdown = {
  showSds40Hints: false,
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
      externalSentenceId: {
        sentenceSequence: 0,
        bookingId: 0,
      },
    },
  ],
  breakdownByReleaseDateType: {},
  otherDates: {},
  ersedNotApplicableDueToDtoLaterThanCrd: false,
}

const stubbedResultsWithBreakdownAndAdjustments: ResultsWithBreakdownAndAdjustments = {
  context: {
    calculationRequestId: stubbedCalculationResults.calculationRequestId,
    overridesCalculationRequestId: 12345,
    prisonerId: stubbedCalculationResults.prisonerId,
    bookingId: stubbedCalculationResults.bookingId,
    calculationDate: stubbedCalculationResults.calculationDate,
    calculationStatus: stubbedCalculationResults.calculationStatus,
    calculationReference: stubbedCalculationResults.calculationReference,
    calculationType: stubbedCalculationResults.calculationType,
    calculationReason: stubbedCalculationResults.calculationReason,
    otherReasonDescription: stubbedCalculationResults.otherReasonDescription,
    usePreviouslyRecordedSLEDIfFound: false,
    calculatedByUsername: 'user1',
    calculatedByDisplayName: 'User One',
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
        offence: {
          offenderChargeId: 1,
          offenceEndDate: '2021-02-03',
          offenceCode: '123',
          offenceDescription: '',
          indicators: [],
        },
        isSDSPlus: false,
        hasAnSDSEarlyReleaseExclusion: 'NO',
        isSDSPlusEligibleSentenceTypeLengthAndOffence: false,
        isSDSPlusOffenceInPeriod: false,
        revocationDates: [],
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
        offence: {
          offenderChargeId: 5,
          offenceEndDate: '2021-02-03',
          offenceCode: '123',
          offenceDescription: '',
          indicators: [],
        },
        isSDSPlus: false,
        hasAnSDSEarlyReleaseExclusion: 'NO',
        isSDSPlusEligibleSentenceTypeLengthAndOffence: false,
        isSDSPlusOffenceInPeriod: false,
        revocationDates: [],
      },
    ],
  },
  approvedDates: {},
}
let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      prisonerService,
      viewReleaseDatesService,
      calculateReleaseDatesService,
    },
  })
})

describe('View print calculation summary controller', () => {})
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
      expect(res.text).toMatch(/<script src="\/assets\/js\/print.js"><\/script>/)
      expect(res.text).toMatch(/Calculation/)
      expectMiniProfile(res.text, {
        name: 'Nobody, Anon',
        dob: '24/06/2000',
        prisonNumber: 'A1234AA',
        establishment: 'Foo Prison (HMP)',
        location: 'D-2-003',
        status: 'Serving Life Imprisonment',
      })
    })
})

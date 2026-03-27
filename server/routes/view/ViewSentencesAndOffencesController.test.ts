import { type Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import PrisonerService from '../../services/prisonerService'
import ViewReleaseDatesService from '../../services/viewReleaseDatesService'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import {
  AnalysedPrisonApiBookingAndSentenceAdjustments,
  PrisonAPIAssignedLivingUnit,
  PrisonApiPrisoner,
  PrisonApiSentenceDetail,
} from '../../@types/prisonApi/prisonClientTypes'
import config from '../../config'
import {
  BookingCalculation,
  CalculationBreakdown,
  CalculationSentenceUserInput,
  CalculationUserInputs,
  SentenceAndOffenceWithReleaseArrangements,
} from '../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { ResultsWithBreakdownAndAdjustments } from '../../@types/calculateReleaseDates/rulesWithExtraAdjustments'
import UserService from '../../services/userService'
import AuditService from '../../services/auditService'
import ReleaseDateWithAdjustments from '../../@types/calculateReleaseDates/releaseDateWithAdjustments'
import { appWithAllRoutes } from '../testutils/appSetup'

jest.mock('../../services/userService')
jest.mock('../../services/calculateReleaseDatesService')
jest.mock('../../services/prisonerService')
jest.mock('../../services/viewReleaseDatesService')
jest.mock('../../services/auditService')

const prisonerService = new PrisonerService(null, null) as jest.Mocked<PrisonerService>
const userService = new UserService(null, prisonerService) as jest.Mocked<UserService>
const auditService = new AuditService() as jest.Mocked<AuditService>
const calculateReleaseDatesService = new CalculateReleaseDatesService(
  auditService,
  null,
) as jest.Mocked<CalculateReleaseDatesService>
const viewReleaseDatesService = new ViewReleaseDatesService(null) as jest.Mocked<ViewReleaseDatesService>

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

const stubbedAdjustments = {
  sentenceAdjustments: [
    {
      sentenceSequence: 1,
      type: 'REMAND',
      numberOfDays: 2,
      fromDate: '2021-02-01',
      toDate: '2021-02-02',
      active: true,
    },
  ],
  bookingAdjustments: [
    {
      type: 'UNLAWFULLY_AT_LARGE',
      numberOfDays: 2,
      fromDate: '2021-03-07',
      toDate: '2021-03-08',
      active: true,
    },
  ],
} as AnalysedPrisonApiBookingAndSentenceAdjustments

const stubbedSentencesAndOffences = [
  {
    terms: [
      {
        years: 3,
      },
    ],
    sentenceDate: '2004-02-03',
    sentenceCalculationType: 'ADIMP',
    sentenceTypeDescription: 'SDS Standard Sentence',
    caseSequence: 1,
    lineSequence: 1,
    sentenceSequence: 1,
    offence: { offenceEndDate: '2021-02-03' },
    isSDSPlus: false,
  } as SentenceAndOffenceWithReleaseArrangements,
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
    offence: { offenceStartDate: '2021-01-04', offenceEndDate: '2021-01-05' },
    isSDSPlus: false,
  } as SentenceAndOffenceWithReleaseArrangements,
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
    offence: { offenceStartDate: '2021-03-06' },
    isSDSPlus: false,
  } as SentenceAndOffenceWithReleaseArrangements,
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
    offence: {},
    isSDSPlus: false,
  } as SentenceAndOffenceWithReleaseArrangements,
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
    offence: { offenceStartDate: '2021-01-07', offenceEndDate: '2021-01-07' },
    isSDSPlus: false,
  } as SentenceAndOffenceWithReleaseArrangements,
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
    offence: { offenceEndDate: '2021-02-03', offenceCode: '123', offenceDescription: 'Doing a crime' },
    isSDSPlus: false,
  } as SentenceAndOffenceWithReleaseArrangements,
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

let app: Express

beforeEach(() => {
  config.featureToggles.sdsExclusionIndicatorsEnabled = false
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

describe('View Sentences and Offences controller tests', () => {
  it('GET /view/:calculationRequestId/sentences-and-offences should return SDS+ badge if sentence is marked as SDS+', () => {
    viewReleaseDatesService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue(
      stubbedResultsWithBreakdownAndAdjustments,
    )
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
        offence: { offenceEndDate: '2021-02-03', offenceCode: '123' },
        isSDSPlus: true,
      } as SentenceAndOffenceWithReleaseArrangements,
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

  it('GET /view/:calculationRequestId/sentences-and-offences should show exclusions if feature toggle is enabled', () => {
    config.featureToggles.sdsExclusionIndicatorsEnabled = true
    viewReleaseDatesService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue(
      stubbedResultsWithBreakdownAndAdjustments,
    )
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
        offence: { offenceEndDate: '2021-02-03', offenceCode: '123', offenceDescription: 'SXOFFENCE' },
        isSDSPlus: true,
        hasAnSDSEarlyReleaseExclusion: 'SEXUAL',
      } as SentenceAndOffenceWithReleaseArrangements,
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
        offence: { offenceEndDate: '2021-02-03', offenceCode: '123', offenceDescription: 'VIOOFFENCE' },
        isSDSPlus: true,
        hasAnSDSEarlyReleaseExclusion: 'VIOLENT',
      } as SentenceAndOffenceWithReleaseArrangements,
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
        offence: { offenceEndDate: '2021-02-03', offenceCode: '123', offenceDescription: 'No exclusion offence' },
        isSDSPlus: true,
        hasAnSDSEarlyReleaseExclusion: 'NO',
      } as SentenceAndOffenceWithReleaseArrangements,
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
        expect($('.sentence-card:contains("SXOFFENCE")').text()).toContain('Sexual')
        expect($('.sentence-card:contains("VIOOFFENCE")').text()).toContain('Violent')
        const noExclusionCard = $('.sentence-card:contains("No exclusion offence")')
        expect(noExclusionCard.text()).not.toContain('Sexual')
        expect(noExclusionCard.text()).not.toContain('Violent')
      })
  })

  it('GET /view/:calculationRequestId/sentences-and-offences should show correctly formatted exclusion for Terrorism, Domestic Abuse and National Security', () => {
    config.featureToggles.sdsExclusionIndicatorsEnabled = true
    viewReleaseDatesService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue(
      stubbedResultsWithBreakdownAndAdjustments,
    )
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
        offence: { offenceEndDate: '2021-02-03', offenceCode: '123', offenceDescription: 'DOMESTIC_ABUSE_OFFENCE' },
        isSDSPlus: true,
        hasAnSDSEarlyReleaseExclusion: 'DOMESTIC_ABUSE',
      } as SentenceAndOffenceWithReleaseArrangements,
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
        offence: { offenceEndDate: '2021-02-03', offenceCode: '123', offenceDescription: 'TERROR_OFFENCE' },
        isSDSPlus: true,
        hasAnSDSEarlyReleaseExclusion: 'TERRORISM',
      } as SentenceAndOffenceWithReleaseArrangements,
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
        offence: { offenceEndDate: '2021-02-03', offenceCode: '123', offenceDescription: 'NSOFFENCE' },
        isSDSPlus: true,
        hasAnSDSEarlyReleaseExclusion: 'NATIONAL_SECURITY',
      } as SentenceAndOffenceWithReleaseArrangements,
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
        expect($('.sentence-card:contains("DOMESTIC_ABUSE_OFFENCE")').text()).toContain('Domestic Abuse')
        expect($('.sentence-card:contains("TERROR_OFFENCE")').text()).toContain('Terrorism')
        expect($('.sentence-card:contains("NSOFFENCE")').text()).toContain('National Security')
      })
  })

  it('GET /view/:calculationRequestId/sentences-and-offences should not show exclusions if feature toggle is off', () => {
    config.featureToggles.sdsExclusionIndicatorsEnabled = false
    viewReleaseDatesService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue(
      stubbedResultsWithBreakdownAndAdjustments,
    )
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
        offence: { offenceEndDate: '2021-02-03', offenceCode: '123', offenceDescription: 'SXOFFENCE' },
        isSDSPlus: true,
        hasAnSDSEarlyReleaseExclusion: 'SEXUAL',
      } as SentenceAndOffenceWithReleaseArrangements,
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
        offence: { offenceEndDate: '2021-02-03', offenceCode: '123', offenceDescription: 'VIOOFFENCE' },
        isSDSPlus: true,
        hasAnSDSEarlyReleaseExclusion: 'VIOLENT',
      } as SentenceAndOffenceWithReleaseArrangements,
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
        offence: { offenceEndDate: '2021-02-03', offenceCode: '123', offenceDescription: 'No exclusion offence' },
        isSDSPlus: true,
        hasAnSDSEarlyReleaseExclusion: 'NO',
      } as SentenceAndOffenceWithReleaseArrangements,
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
        expect($('.sentence-card:contains("SXOFFENCE")').text()).not.toContain('Sexual')
        expect($('.sentence-card:contains("VIOOFFENCE")').text()).not.toContain('Violent')
      })
  })

  it('GET /view/:calculationRequestId/sentences-and-offences should return SDS+ badge if user marked sentence as SDS+', () => {
    viewReleaseDatesService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue(
      stubbedResultsWithBreakdownAndAdjustments,
    )
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
        offence: { offenceEndDate: '2021-02-03', offenceCode: '123' },
        isSDSPlus: false,
      } as SentenceAndOffenceWithReleaseArrangements,
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
    calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue(
      stubbedResultsWithBreakdownAndAdjustments,
    )
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
    calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue(
      stubbedResultsWithBreakdownAndAdjustments,
    )
    viewReleaseDatesService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedAdjustments)
    viewReleaseDatesService.getCalculationUserInputs.mockResolvedValue({
      calculateErsed: false,
      useOffenceIndicators: false,
      sentenceCalculationUserInputs: [],
      usePreviouslyRecordedSLEDIfFound: false,
    })
    return request(app)
      .get('/view/A1234AA/sentences-and-offences/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('SDS+')
      })
  })
  it('GET /view/:calculationRequestId/sentences-and-offences should show details if the calculation is a genuine override', () => {
    viewReleaseDatesService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    viewReleaseDatesService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedAdjustments)
    viewReleaseDatesService.getCalculationUserInputs.mockResolvedValue(stubbedUserInput)
    calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue({
      ...stubbedResultsWithBreakdownAndAdjustments,
      context: {
        ...stubbedResultsWithBreakdownAndAdjustments.context,
        calculationType: 'GENUINE_OVERRIDE',
        genuineOverrideReasonCode: 'OTHER',
        genuineOverrideReasonDescription: 'Some details about the GO',
      },
    })
    return request(app)
      .get('/view/A1234AA/sentences-and-offences/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect(
          $('.summary-source-value')
            .text()
            .trim()
            .split('\n')
            .map(it => it.trim()),
        ).toStrictEqual(['User Override', '', 'Some details about the GO'])
      })
  })

  it('GET /view/:calculationRequestId/sentences-and-offences should show details if the calculation reason required further details and is not other', () => {
    viewReleaseDatesService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    viewReleaseDatesService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedAdjustments)
    viewReleaseDatesService.getCalculationUserInputs.mockResolvedValue(stubbedUserInput)
    calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue({
      ...stubbedResultsWithBreakdownAndAdjustments,
      context: {
        ...stubbedResultsWithBreakdownAndAdjustments.context,
        calculationType: 'CALCULATED',
        calculationReason: {
          id: 2,
          displayName: 'Legislative changes',
          isOther: false,
          useForApprovedDates: false,
          requiresFurtherDetail: true,
        },
        otherReasonDescription: 'Fixed term recall 56',
      },
    })
    return request(app)
      .get('/view/A1234AA/sentences-and-offences/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const reasonSummaryItems = $('dt:contains("Calculation reason")').next().find('p')
        expect(reasonSummaryItems.eq(0).text().trim()).toStrictEqual('Legislative changes')
        expect(reasonSummaryItems.eq(1).text().trim()).toStrictEqual('(Fixed term recall 56)')
      })
  })

  it('GET /view/:calculationRequestId/sentences-and-offences should show details if the calculation reason is OTHER', () => {
    viewReleaseDatesService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    viewReleaseDatesService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedAdjustments)
    viewReleaseDatesService.getCalculationUserInputs.mockResolvedValue(stubbedUserInput)
    calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue({
      ...stubbedResultsWithBreakdownAndAdjustments,
      context: {
        ...stubbedResultsWithBreakdownAndAdjustments.context,
        calculationReason: {
          id: 2,
          displayName: 'Other',
          isOther: true,
          useForApprovedDates: false,
          requiresFurtherDetail: true,
        },
        otherReasonDescription: 'Another reason for calculation',
      },
    })
    return request(app)
      .get('/view/A1234AA/sentences-and-offences/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Other (Another reason for calculation)')
      })
  })

  // split into summary here

  it('GET /view/:nomsId/calculation-summary/:calculationRequestId should display the reason', () => {
    calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue({
      ...stubbedResultsWithBreakdownAndAdjustments,
      context: {
        ...stubbedResultsWithBreakdownAndAdjustments.context,
        calculationDate: '2024-01-13',
        calculationReason: {
          id: 1,
          displayName: 'A calculation reason',
          isOther: false,
          useForApprovedDates: false,
          requiresFurtherDetail: false,
        },
      },
    })

    return request(app)
      .get('/view/A1234AA/calculation-summary/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Calculation reason')
        expect(res.text).toContain('A calculation reason')
        expect(res.text).toContain('13 January 2024')
      })
  })

  it('GET /view/:nomsId/calculation-summary/:calculationRequestId should display the reasons further detail', () => {
    calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue({
      ...stubbedResultsWithBreakdownAndAdjustments,
      context: {
        ...stubbedResultsWithBreakdownAndAdjustments.context,
        calculationDate: '2024-01-13',
        calculationReason: {
          id: 2,
          displayName: 'Legislative changes',
          isOther: false,
          useForApprovedDates: false,
          requiresFurtherDetail: true,
        },
        otherReasonDescription: 'Fixed term recall 56',
      },
    })

    return request(app)
      .get('/view/A1234AA/calculation-summary/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const reasonSummaryItems = $('dt:contains("Calculation reason")').next().find('p')
        expect(reasonSummaryItems.eq(0).text().trim()).toStrictEqual('Legislative changes')
        expect(reasonSummaryItems.eq(1).text().trim()).toStrictEqual('(Fixed term recall 56)')
      })
  })

  it('GET /view/:nomsId/calculation-summary/:calculationRequestId should display the calculation meta data if name and establishment present', () => {
    calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue({
      ...stubbedResultsWithBreakdownAndAdjustments,
      context: {
        ...stubbedResultsWithBreakdownAndAdjustments.context,
        calculationDate: '2024-01-13',
        calculationReason: {
          id: 1,
          displayName: 'A calculation reason',
          isOther: false,
          useForApprovedDates: false,
          requiresFurtherDetail: false,
        },
        calculatedByDisplayName: 'User One',
        calculatedAtPrisonDescription: 'Kirkham (HMP)',
      },
    })

    return request(app)
      .get('/view/A1234AA/calculation-summary/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('dt:contains("Calculation date")').next().text().trim()).toStrictEqual('13 January 2024')
        expect($('dt:contains("Calculation reason")').next().text().trim()).toStrictEqual('A calculation reason')
        expect($('dt:contains("Calculated by")').next().text().trim()).toStrictEqual('User One at Kirkham (HMP)')
        expect($('dt:contains("Source")').next().text().trim()).toStrictEqual('Calculate release dates service')
      })
  })
})

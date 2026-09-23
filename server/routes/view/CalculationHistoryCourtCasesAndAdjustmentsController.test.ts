import { type Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import PrisonerService from '../../services/prisonerService'
import ViewReleaseDatesService from '../../services/viewReleaseDatesService'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import {
  PrisonAPIAssignedLivingUnit,
  PrisonApiPrisoner,
  PrisonApiSentenceDetail,
} from '../../@types/prisonApi/prisonClientTypes'
import {
  AdjustmentDto,
  AnalysedSentenceAndOffence,
  BookingCalculation,
  CalculationBreakdown,
  DetailedCalculationResults,
} from '../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import UserService from '../../services/userService'
import AuditService from '../../services/auditService'
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
    isSecondCheck: false,
  },
} as BookingCalculation

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

const stubbedAdjustments: AdjustmentDto[] = [
  {
    person: stubbedCalculationResults.prisonerId,
    sentenceSequence: 1,
    adjustmentType: 'REMAND',
    effectiveDays: 2,
    fromDate: '2021-02-01',
    toDate: '2021-02-02',
  },
  {
    person: stubbedCalculationResults.prisonerId,
    adjustmentType: 'UNLAWFULLY_AT_LARGE',
    effectiveDays: 2,
    fromDate: '2021-03-07',
    toDate: '2021-03-08',
  },
]

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
    hasAnSDSEarlyReleaseExclusion: 'NO',
    sentenceAndOffenceAnalysis: 'SAME',
    caseReference: 'Y987654ZX',
  } as AnalysedSentenceAndOffence,
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
    hasAnSDSEarlyReleaseExclusion: 'NO',
    sentenceAndOffenceAnalysis: 'SAME',
    caseReference: 'Y987654ZX',
  } as AnalysedSentenceAndOffence,
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
    hasAnSDSEarlyReleaseExclusion: 'NO',
    sentenceAndOffenceAnalysis: 'SAME',
    caseReference: 'Y987654ZX',
  } as AnalysedSentenceAndOffence,
  {
    terms: [
      {
        years: 3,
      },
    ],
    sentenceCalculationType: 'ADIMP',
    sentenceTypeDescription: 'SDS Standard Sentence',
    caseSequence: 2,
    lineSequence: 1,
    sentenceSequence: 1,
    offence: {},
    isSDSPlus: false,
    hasAnSDSEarlyReleaseExclusion: 'NO',
    sentenceAndOffenceAnalysis: 'SAME',
    caseReference: 'X123456BC',
    courtDescription: 'Exeter Crown Court',
  } as AnalysedSentenceAndOffence,
  {
    terms: [
      {
        years: 3,
      },
    ],
    sentenceCalculationType: 'ADIMP',
    sentenceTypeDescription: 'SDS Standard Sentence',
    caseSequence: 2,
    lineSequence: 2,
    sentenceSequence: 1,
    caseReference: 'X123456BC',
    courtDescription: 'Exeter Crown Court',
    offence: { offenceStartDate: '2021-01-07', offenceEndDate: '2021-01-07' },
  } as AnalysedSentenceAndOffence,
  {
    terms: [
      {
        years: 2,
      },
    ],
    caseSequence: 3,
    lineSequence: 2,
    sentenceSequence: 2,
    consecutiveToSequence: 1,
    sentenceCalculationType: 'ADIMP',
    sentenceTypeDescription: 'SDS Standard Sentence',
    offence: { offenceEndDate: '2021-02-03', offenceCode: '123', offenceDescription: 'Doing a crime' },
    isSDSPlus: false,
    hasAnSDSEarlyReleaseExclusion: 'NO',
    sentenceAndOffenceAnalysis: 'SAME',
    courtDescription: 'Exeter Crown Court',
  } as AnalysedSentenceAndOffence,
]

const stubbedDetailedCalculationResults: DetailedCalculationResults = {
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
    sentencesAndOffences: stubbedSentencesAndOffences,
    adjustments: stubbedAdjustments,
  },
  approvedDates: {},
  allocatedTranches: [],
  secondCheckDetails: null,
}

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      userService,
      prisonerService,
      calculateReleaseDatesService,
      viewReleaseDatesService,
    },
  })
  prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('View court cases and adjustments controller tests', () => {
  it('Should have the correct navigation', () => {
    calculateReleaseDatesService.getDetailedCalculationResults.mockResolvedValue(stubbedDetailedCalculationResults)
    return request(app)
      .get('/view/A1234AA/calculation-history/CRDS/123456/court-cases-and-adjustments?returnToPage=3')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const expected = '/view/A1234AA/calculation-history/CRDS/123456/overview?page=3'
        expect($('[data-qa=back-link]').attr('href')).toStrictEqual(expected)
        expect($('[data-qa=return-to-overview-link]').attr('href')).toStrictEqual(expected)
      })
  })

  it('Should show court cases and adjustments', () => {
    calculateReleaseDatesService.getDetailedCalculationResults.mockResolvedValue(stubbedDetailedCalculationResults)
    return request(app)
      .get('/view/A1234AA/calculation-history/CRDS/123456/court-cases-and-adjustments?returnToPage=3')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const caseHeadings = $('.case-heading')
        expect(caseHeadings).toHaveLength(3)
        expect(caseHeadings.eq(0).text().trim()).toStrictEqual('Y987654ZX')
        expect(caseHeadings.eq(1).text().trim()).toStrictEqual('X123456BC at Exeter Crown Court')
        expect(caseHeadings.eq(2).text().trim()).toStrictEqual('Court case 3 at Exeter Crown Court')
      })
  })

  it('Should return SDS+ badge if sentence is marked as SDS+', () => {
    calculateReleaseDatesService.getDetailedCalculationResults.mockResolvedValue({
      ...stubbedDetailedCalculationResults,
      calculationOriginalData: {
        ...stubbedDetailedCalculationResults.calculationOriginalData,
        sentencesAndOffences: [
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
            sentenceAndOffenceAnalysis: 'SAME',
          } as AnalysedSentenceAndOffence,
        ],
      },
    })
    return request(app)
      .get('/view/A1234AA/calculation-history/CRDS/123456/court-cases-and-adjustments?returnToPage=3')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('.moj-badge.moj-badge--small:contains("SDS+")')).toHaveLength(1)
      })
  })

  it('Should show SDS40 and Progression Model exclusions if they are present', () => {
    calculateReleaseDatesService.getDetailedCalculationResults.mockResolvedValue({
      ...stubbedDetailedCalculationResults,
      calculationOriginalData: {
        ...stubbedDetailedCalculationResults.calculationOriginalData,
        sentencesAndOffences: [
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
            sdsDescriptions: {
              sds40ExclusionDescription: 'Sexual',
            },
          } as AnalysedSentenceAndOffence,
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
            offence: { offenceEndDate: '2021-02-03', offenceCode: '123', offenceDescription: 'PMOFFENCE' },
            isSDSPlus: false,
            hasAnSDSEarlyReleaseExclusion: 'PROGRESSION_MODEL_SCHEDULE_13_PART_3',
            sentenceAndOffenceAnalysis: 'SAME',
            sdsDescriptions: {
              progressionModelDoesNotApplyDescription: 'Would be SDS+',
            },
          } as AnalysedSentenceAndOffence,
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
            isSDSPlus: false,
            sentenceAndOffenceAnalysis: 'SAME',
            hasAnSDSEarlyReleaseExclusion: 'NO',
            sdsDescriptions: {},
          } as AnalysedSentenceAndOffence,
        ],
      },
    })
    return request(app)
      .get('/view/A1234AA/calculation-history/CRDS/123456/court-cases-and-adjustments?returnToPage=3')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const sexualOffenceCard = $('.sentence-card:contains("SXOFFENCE")')
        expect(sexualOffenceCard).toHaveLength(1)
        expect(sexualOffenceCard.find('[data-qa=sds-40-early-release-exclusion]').text()).toContain('Sexual')
        expect(sexualOffenceCard.find('[data-qa=sds-progression-model-does-not-apply]')).toHaveLength(0)

        const progressionModelOffenceCard = $('.sentence-card:contains("PMOFFENCE")')
        expect(progressionModelOffenceCard.find('[data-qa=sds-40-early-release-exclusion]')).toHaveLength(0)
        expect(progressionModelOffenceCard.find('[data-qa=sds-progression-model-does-not-apply]').text()).toContain(
          'Would be SDS+',
        )

        const noExclusionCard = $('.sentence-card:contains("No exclusion offence")')
        expect(noExclusionCard.find('[data-qa=sds-40-early-release-exclusion]')).toHaveLength(0)
        expect(noExclusionCard.find('[data-qa=sds-progression-model-does-not-apply]')).toHaveLength(0)
      })
  })

  it.each(['SDS+', 'YOI+', 'S250+'])(
    'Should return SDS+ badges as defined by backend',
    (sdsPlusDescription: string) => {
      calculateReleaseDatesService.getDetailedCalculationResults.mockResolvedValue({
        ...stubbedDetailedCalculationResults,
        calculationOriginalData: {
          ...stubbedDetailedCalculationResults.calculationOriginalData,
          sentencesAndOffences: [
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
              offence: { offenceEndDate: '2021-02-03', offenceCode: '123', offenceDescription: 'SDS plus offence' },
              sdsDescriptions: {
                sdsPlusDisplayName: sdsPlusDescription,
              },
            } as AnalysedSentenceAndOffence,
          ],
        },
      })
      return request(app)
        .get('/view/A1234AA/calculation-history/CRDS/123456/court-cases-and-adjustments?returnToPage=3')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($(`.moj-badge.moj-badge--small:contains("${sdsPlusDescription}")`)).toHaveLength(1)
        })
    },
  )
})

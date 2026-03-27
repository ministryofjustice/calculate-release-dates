import request from 'supertest'
import type { Express } from 'express'
import * as cheerio from 'cheerio'
import PrisonerService from '../../services/prisonerService'
import UserService from '../../services/userService'
import ViewReleaseDatesService from '../../services/viewReleaseDatesService'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import { appWithAllRoutes } from '../testutils/appSetup'
import {
  BookingCalculation,
  CalculationBreakdown,
  SentenceAndOffenceWithReleaseArrangements,
} from '../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { PrisonAPIAssignedLivingUnit, PrisonApiPrisoner } from '../../@types/prisonApi/prisonClientTypes'
import { expectMiniProfile, expectNoMiniProfile } from '../testutils/layoutExpectations'
import { ResultsWithBreakdownAndAdjustments } from '../../@types/calculateReleaseDates/rulesWithExtraAdjustments'

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

describe('View calculation summary controller tests', () => {
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
        expect(res.text).toContain('Calculation reason')
        expect(res.text).toContain('A calculation reason')
        expect(res.text).toContain('01 June 2020')
        expect(res.text).toContain('/?prisonId=A1234AA')
        expect(res.text).toContain('Why are some details missing?')
        expect(res.text).toContain('How are final release dates calculated?')
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })

  describe('View calculation tests', () => {
    it('GET /view/:nomsId/calculation-summary/:calculationRequestId should not show help links for manual calculation', () => {
      calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue({
        ...stubbedResultsWithBreakdownAndAdjustments,
        context: {
          calculationRequestId: stubbedCalculationResults.calculationRequestId,
          prisonerId: stubbedCalculationResults.prisonerId,
          bookingId: stubbedCalculationResults.bookingId,
          calculationDate: stubbedCalculationResults.calculationDate,
          calculationStatus: stubbedCalculationResults.calculationStatus,
          calculationReference: stubbedCalculationResults.calculationReference,
          calculationType: 'MANUAL_DETERMINATE',
          calculationReason: stubbedCalculationResults.calculationReason,
          otherReasonDescription: stubbedCalculationResults.otherReasonDescription,
          usePreviouslyRecordedSLEDIfFound: false,
          calculatedByUsername: 'user1',
          calculatedByDisplayName: 'User One',
        },
      })
      prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      return request(app)
        .get('/view/A1234AA/calculation-summary/123456')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).not.toContain('Why are some details missing?')
          expect(res.text).not.toContain('How are final release dates calculated?')
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

  it('GET /view/:nomsId/calculation-summary/:calculationRequestId should display the calculation meta data if name but no establishment present', () => {
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
        calculatedAtPrisonDescription: undefined,
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
        expect($('dt:contains("Calculated by")').next().text().trim()).toStrictEqual('User One')
        expect($('dt:contains("Source")').next().text().trim()).toStrictEqual('Calculate release dates service')
      })
  })

  it('GET /view/:nomsId/calculation-summary/:calculationRequestId should display the calculation meta data if no name but there is an establishment present', () => {
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
        calculatedByDisplayName: undefined,
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
        expect($('dt:contains("Calculated by")').next().text().trim()).toStrictEqual('Kirkham (HMP)')
        expect($('dt:contains("Source")').next().text().trim()).toStrictEqual('Calculate release dates service')
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
        expect(res.text).toContain('/?prisonId=A1234AA')
        expect($('[data-qa="sub-nav-sent-and-off"]').first().attr('href')).toStrictEqual(
          '/view/A1234AA/sentences-and-offences/123456',
        )
        expect($('[data-qa=sub-nav-calc-summary]').first().attr('href')).toStrictEqual(
          '/view/A1234AA/calculation-summary/123456',
        )
      })
  })

  it('GET /view/:calculationRequestId/calculation-summary should display the other reason if it was selected', () => {
    calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue({
      ...stubbedResultsWithBreakdownAndAdjustments,
      context: {
        ...stubbedResultsWithBreakdownAndAdjustments.context,
        calculationDate: '2024-01-19',
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
      .get('/view/A1234AA/calculation-summary/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Calculation reason')
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
            offence: {
              offenderChargeId: 1,
              offenceEndDate: '2021-02-03',
              offenceCode: '123',
              offenceDescription: '',
              indicators: [],
            },
            isSDSPlus: false,
            hasAnSDSEarlyReleaseExclusion: 'NO',
          } as SentenceAndOffenceWithReleaseArrangements,
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
    const detailedCalResultWIthNotificationBannerSentencesAndOffences: ResultsWithBreakdownAndAdjustments = {
      ...stubbedResultsWithBreakdownAndAdjustments,
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
            sentenceCalculationType: 'EDS18',
            sentenceTypeDescription: 'SDS Standard Sentence',
            offence: {
              offenderChargeId: 2,
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

  it('GET /view/:nomsId/calculation-summary/:calculationRequestId should show genuine override details', () => {
    calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue({
      ...stubbedResultsWithBreakdownAndAdjustments,
      context: {
        ...stubbedResultsWithBreakdownAndAdjustments.context,
        calculationType: 'GENUINE_OVERRIDE',
        genuineOverrideReasonCode: 'OTHER',
        genuineOverrideReasonDescription: 'Some details about the GO',
      },
    })
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .get('/view/A1234AA/calculation-summary/123456')
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

  it('GET /view/:nomsId/calculation-summary/:calculationRequestId/print should return a printable page about the calculation requested', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue(
      stubbedResultsWithBreakdownAndAdjustments,
    )
    return request(app)
      .get('/view/A1234AB/calculation-summary/123456/print')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Anon Nobody')
        expect(res.text).toMatch(/<script src="\/assets\/js\/print.js"><\/script>/)
        expect(res.text).toMatch(/Dates for/)
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })
})

// Test data based on the original route tests. These are minimal but
// structurally compatible with the controller and templates.

const stubbedPrisonerData: PrisonApiPrisoner = {
  bookingId: 1,
  offenderId: 1,
  rootOffenderId: 1,
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
  assignedLivingUnit: {
    agencyName: 'Foo Prison (HMP)',
    description: 'D-2-003',
  } as PrisonAPIAssignedLivingUnit,
}

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
  releaseDatesWithAdjustments: [
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
  ],
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

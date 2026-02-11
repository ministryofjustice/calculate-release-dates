import { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import PrisonerService from '../../services/prisonerService'
import { appWithAllRoutes, user } from '../testutils/appSetup'
import { ResultsWithBreakdownAndAdjustments } from '../../@types/calculateReleaseDates/rulesWithExtraAdjustments'
import ReleaseDateWithAdjustments from '../../@types/calculateReleaseDates/releaseDateWithAdjustments'
import {
  PrisonAPIAssignedLivingUnit,
  PrisonApiPrisoner,
  PrisonApiSentenceDetail,
} from '../../@types/prisonApi/prisonClientTypes'
import ViewReleaseDatesService from '../../services/viewReleaseDatesService'
import {
  BookingCalculation,
  CalculationBreakdown,
} from '../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import config from '../../config'

jest.mock('../../services/calculateReleaseDatesService')
jest.mock('../../services/prisonerService')

describe('calculationSummaryOverridesController', () => {
  let app: Express

  const calculateReleaseDatesService = new CalculateReleaseDatesService(
    null,
    null,
  ) as jest.Mocked<CalculateReleaseDatesService>
  const prisonerService = new PrisonerService(null, null) as jest.Mocked<PrisonerService>
  const viewReleaseDatesService = new ViewReleaseDatesService(null) as jest.Mocked<ViewReleaseDatesService>

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

  let userRoles: string[]

  afterEach(() => {
    jest.resetAllMocks()
    userRoles = user.userRoles
    config.featureToggles.showBreakdown = true

    app = appWithAllRoutes({
      services: {
        calculateReleaseDatesService,
        prisonerService,
      },
      userSupplier: () => {
        return { ...user, userRoles }
      },
    })
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
  })

  it('GET /view/:nomsId/calculation-summary/:calculationRequestId/overrides should redirect to summary if no override is present', () => {
    calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue({
      context: {
        calculationRequestId: stubbedCalculationResults.calculationRequestId,
        overridesCalculationRequestId: null,
      },
    } as ResultsWithBreakdownAndAdjustments)
    app = appWithAllRoutes({
      services: {
        prisonerService,
        calculateReleaseDatesService,
        viewReleaseDatesService,
      },
    })

    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app).get('/view/A1234AA/calculation-summary/123456/overrides').expect(302)
  })
  it('GET /view/:nomsId/calculation-summary/:calculationRequestId/overrides should show CRDS and Overridden dates', () => {
    calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockImplementation(
      async calculationRequestId => {
        if (calculationRequestId === stubbedCalculationResults.calculationRequestId) {
          return {
            ...stubbedResultsWithBreakdownAndAdjustments,
            dates: {
              CRD: {
                date: '2021-02-03',
                type: 'CRD',
                description: 'Conditional release date',
                hints: [],
              },
              SED: { date: '2021-01-05', type: 'SED', description: 'Sentence expiry date', hints: [] },
              HDCED: {
                date: '2025-01-05',
                type: 'HDCED',
                description: 'Home detention curfew eligibility date',
                hints: [{ text: 'Tuesday, 05 October 2021 when adjusted to a working day' }],
              },
            },
          } as ResultsWithBreakdownAndAdjustments
        }
        return {
          ...stubbedResultsWithBreakdownAndAdjustments,
          dates: {
            CRD: {
              date: '2021-02-05',
              type: 'CRD',
              description: 'Conditional release date',
              hints: [],
            },
            SED: { date: '2025-01-05', type: 'SED', description: 'Sentence expiry date', hints: [] },
            HDCED: {
              date: '2021-01-05',
              type: 'HDCED',
              description: 'Home detention curfew eligibility date',
              hints: [{ text: 'Tuesday, 05 October 2021 when adjusted to a working day' }],
            },
          },
        } as ResultsWithBreakdownAndAdjustments
      },
    )
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .get('/view/A1234AA/calculation-summary/123456/overrides')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('#release-dates-crds [data-qa="CRD-date"]').text()).toContain('Friday, 05 February 2021')
        expect($('#release-dates-entered [data-qa="CRD-date"]').text()).toContain('Wednesday, 03 February 2021')
        expect($('#release-dates-crds [data-qa="SED-date"]').text()).toContain('Sunday, 05 January 2025')
        expect($('#release-dates-entered [data-qa="SED-date"]').text()).toContain('Tuesday, 05 January 2021')
        expect($('#release-dates-crds [data-qa="HDCED-date"]').text()).toContain('Tuesday, 05 January 2021')
        expect($('#release-dates-entered [data-qa="HDCED-date"]').text()).toContain('Sunday, 05 January 2025')
        // hints should only show for dates entered
        expect($('#release-dates-entered [data-qa=HDCED-release-date-hint-0]').text()).toStrictEqual(
          'Tuesday, 05 October 2021 when adjusted to a working day',
        )
        expect($('#release-dates-crds [data-qa=HDCED-release-date-hint-0]').text()).toStrictEqual('')
      })
  })
})

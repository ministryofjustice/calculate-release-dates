import { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import MockDate from 'mockdate'
import { HttpError } from 'http-errors'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import { appWithAllRoutes } from '../testutils/appSetup'
import SessionSetup from '../testutils/sessionSetup'
import PrisonerService from '../../services/prisonerService'
import { PrisonAPIAssignedLivingUnit, PrisonApiPrisoner } from '../../@types/prisonApi/prisonClientTypes'
import { expectMiniProfile } from '../testutils/layoutExpectations'
import { pedAdjustedByCrdAndBeforePrrdBreakdown } from '../../services/breakdownExamplesTestData'
import {
  BookingCalculation,
  CalculationBreakdown,
} from '../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import config from '../../config'
import { ResultsWithBreakdownAndAdjustments } from '../../@types/calculateReleaseDates/rulesWithExtraAdjustments'
import ReleaseDateWithAdjustments from '../../@types/calculateReleaseDates/releaseDateWithAdjustments'

jest.mock('../../services/calculateReleaseDatesService')
jest.mock('../../services/prisonerService')

describe('CalculationSummaryController', () => {
  let app: Express
  const sessionSetup = new SessionSetup()

  const calculateReleaseDatesService = new CalculateReleaseDatesService(
    null,
  ) as jest.Mocked<CalculateReleaseDatesService>
  const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>

  const prisonerNumber = 'A1234BC'
  const stubbedPrisonerData = {
    offenderNo: prisonerNumber,
    firstName: 'Anon',
    lastName: 'Nobody',
    dateOfBirth: '2000-06-24',
    assignedLivingUnit: {
      agencyName: 'Foo Prison (HMP)',
      description: 'D-2-003',
    } as PrisonAPIAssignedLivingUnit,
    imprisonmentStatusDescription: 'Serving Life Imprisonment',
  } as PrisonApiPrisoner

  const stubbedCalculationResults = {
    dates: {
      CRD: '2021-02-03',
      SED: '2021-02-03',
      HDCED: '2021-10-03',
      ERSED: '2020-02-03',
    },
    calculationRequestId: 123456,
    effectiveSentenceLength: null,
    prisonerId: prisonerNumber,
    calculationStatus: 'CONFIRMED',
    calculationReference: 'ABC123',
    calculationType: 'CALCULATED',
    bookingId: 123,
    approvedDates: {},
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
        },
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
            offenderChargeId: 2,
            offenceStartDate: '2021-01-04',
            offenceEndDate: '2021-01-05',
            offenceCode: '123',
            offenceDescription: '',
            indicators: [],
          },
          isSDSPlus: false,
          hasAnSDSEarlyReleaseExclusion: 'NO',
          isSDSPlusEligibleSentenceTypeLengthAndOffence: false,
          isSDSPlusOffenceInPeriod: false,
        },
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
            offenderChargeId: 3,
            offenceStartDate: '2021-03-06',
            offenceCode: '123',
            offenceDescription: '',
            indicators: [],
          },
          isSDSPlus: false,
          hasAnSDSEarlyReleaseExclusion: 'NO',
          isSDSPlusEligibleSentenceTypeLengthAndOffence: false,
          isSDSPlusOffenceInPeriod: false,
        },
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
            offenderChargeId: 4,
            offenceStartDate: '2021-01-07',
            offenceEndDate: '2021-01-07',
            offenceCode: '123',
            offenceDescription: '',
            indicators: [],
          },
          isSDSPlus: false,
          hasAnSDSEarlyReleaseExclusion: 'NO',
          isSDSPlusEligibleSentenceTypeLengthAndOffence: false,
          isSDSPlusOffenceInPeriod: false,
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
        },
      ],
    },
    approvedDates: {},
    tranche: 'TRANCHE_1',
  }
  const expectedMiniProfile = {
    name: 'Nobody, Anon',
    dob: '24/06/2000',
    prisonNumber: prisonerNumber,
    establishment: 'Foo Prison (HMP)',
    location: 'D-2-003',
    status: 'Serving Life Imprisonment',
  }

  beforeEach(() => {
    config.featureToggles.showBreakdown = true
    app = appWithAllRoutes({
      services: {
        calculateReleaseDatesService,
        prisonerService,
      },
      sessionSetup,
    })
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
  })

  afterEach(() => {
    jest.resetAllMocks()
    config.featureToggles.showBreakdown = true
  })

  describe('GET', () => {
    it(`GET /calculation/${prisonerNumber}/123456/confirmation should return details about the calculation requested`, () => {
      calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue(
        stubbedResultsWithBreakdownAndAdjustments,
      )
      return request(app)
        .get(`/calculation/${prisonerNumber}/123456/confirmation`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-qa=cancel-link]').first().attr('href')).toStrictEqual(
            `/calculation/${prisonerNumber}/cancelCalculation?redirectUrl=/calculation/${prisonerNumber}/123456/confirmation`,
          )
          const submitToNomis = $('[data-qa=submit-to-nomis]').first()
          expect(submitToNomis.length).toStrictEqual(1)
        })
    })

    it('GET /calculation/:nomsId/summary/:calculationRequestId should hide breakdown if feature toggle is off', () => {
      config.featureToggles.showBreakdown = false
      calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue(
        stubbedResultsWithBreakdownAndAdjustments,
      )
      return request(app)
        .get(`/calculation/${prisonerNumber}/summary/123456`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).not.toContain('Calculation breakdown')
        })
    })

    it('GET /calculation/:nomsId/summary/:calculationRequestId should return details about the calculation requested', () => {
      calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue(
        stubbedResultsWithBreakdownAndAdjustments,
      )
      return request(app)
        .get(`/calculation/${prisonerNumber}/summary/123456`)
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
          expect(res.text).not.toContain('From 16 January, the policy for calculating ERSED has changed')
          expectMiniProfile(res.text, expectedMiniProfile)
          expect(res.text).not.toContain(
            'Early removal cannot happen as release from the Detention Training Order (DTO) is later than the Conditional Release Date (CRD).',
          )
          expect(res.text).toContain('Calculation breakdown')
          const $ = cheerio.load(res.text)
          expect($('[data-qa=cancel-link]').first().attr('href')).toStrictEqual(
            `/calculation/${prisonerNumber}/cancelCalculation?redirectUrl=/calculation/${prisonerNumber}/summary/123456`,
          )
          const submitToNomis = $('[data-qa=submit-to-nomis]').first()
          expect(submitToNomis.attr('href')).toStrictEqual(
            `/calculation/${prisonerNumber}/123456/approved-dates-question`,
          )
        })
    })

    it('GET /calculation/:nomsId/summary/:calculationRequestId should show ERSED recall notification banner if recall only', () => {
      calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue({
        ...stubbedResultsWithBreakdownAndAdjustments,
        calculationOriginalData: {
          ...stubbedResultsWithBreakdownAndAdjustments,
          sentencesAndOffences: [
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
              offence: {
                offenderChargeId: 1,
                offenceStartDate: '2020-01-01',
                offenceCode: 'RL05016',
                offenceDescription: 'Access / exit by unofficial route - railway bye-law',
                indicators: [],
              },
              isSDSPlus: false,
              hasAnSDSEarlyReleaseExclusion: 'NO',
              isSDSPlusEligibleSentenceTypeLengthAndOffence: false,
              isSDSPlusOffenceInPeriod: false,
            },
          ],
        },
      })
      return request(app)
        .get(`/calculation/${prisonerNumber}/summary/123456`)
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
      calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue({
        ...stubbedResultsWithBreakdownAndAdjustments,
        calculationBreakdown: undefined,
        releaseDatesWithAdjustments: undefined,
        breakdownMissingReason: 'UNSUPPORTED_CALCULATION_BREAKDOWN',
      })

      return request(app)
        .get(`/calculation/${prisonerNumber}/summary/123456`)
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
      const stubbedCalculationBreakdownWithErsedBanner: CalculationBreakdown = {
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
        ersedNotApplicableDueToDtoLaterThanCrd: true,
      }
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
        calculationBreakdown: stubbedCalculationBreakdownWithErsedBanner,
      })

      return request(app)
        .get('/calculation/A1234AA/summary/123456')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const ersedNABanner = $('[data-qa=ersed-na-banner]').first()
          const impTitle = $('[data-qa=important-title]').first()
          expect(impTitle.text()).toStrictEqual('Important')
          expect(ersedNABanner.text()).toStrictEqual(
            'Early removal cannot happen as release from the Detention Training Order (DTO) is later than the Conditional Release Date (CRD).',
          )
        })
    })
    it('GET /calculation/:nomsId/summary/:calculationRequestId should not error and also not display ERSED Not applicable banner when calculationBreakdown is null', () => {
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
        calculationBreakdown: null,
      })

      return request(app)
        .get('/calculation/A1234AA/summary/123456')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const ersedNABanner = $('[data-qa=ersed-na-banner]').first()
          const impTitle = $('[data-qa=important-title]').first()
          expect(impTitle.length).toBe(0)
          expect(ersedNABanner.length).toBe(0)
        })
    })
    it('GET /calculation/:nomsId/summary/:calculationRequestId should display upcoming HDCED changes notification', () => {
      prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue(
        stubbedResultsWithBreakdownAndAdjustments,
      )
      return request(app)
        .get(`/calculation/${prisonerNumber}/summary/123456`)
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
        .get(`/calculation/${prisonerNumber}/summary/123456`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).not.toContain('This service has calculated the HDCED using the new policy rules.')
          expect(res.text).not.toContain('From 6 June, the policy for calculating HDCED has changed')
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
    it('GET /calculation/:nomsId/summary/:calculationRequestId should not display tranche label', () => {
      const dataWithTranche1 = { ...stubbedResultsWithBreakdownAndAdjustments }
      dataWithTranche1.tranche = 'TRANCHE_1'
      calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue(dataWithTranche1)
      return request(app)
        .get(`/calculation/${prisonerNumber}/summary/123456`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const trancheSelector = $('[data-qa=sds-early-release-tranche]').first()
          expect(trancheSelector.length).toBe(0)
        })
    })
  })

  describe('POST', () => {
    it('POST /calculation/:nomsId/summary/:calculationRequestId should redirect if an error is thrown', () => {
      const error = {
        status: 412,
        message: 'An error has occurred',
      } as HttpError

      calculateReleaseDatesService.confirmCalculation.mockImplementation(() => {
        throw error
      })
      return request(app)
        .post(`/calculation/${prisonerNumber}/summary/123456`)
        .expect(302)
        .expect(res => {
          expect(res.redirect).toBeTruthy()
        })
    })
    it('POST /calculation/:nomsId/summary/:calculationRequestId should submit release dates', () => {
      calculateReleaseDatesService.confirmCalculation.mockResolvedValue({
        dates: {},
        calculationRequestId: 654321,
        effectiveSentenceLength: null,
        prisonerId: 'A1234AA',
        calculationReference: 'ABC123',
        bookingId: 123,
        calculationStatus: 'PRELIMINARY',
        calculationType: 'CALCULATED',
      })
      return request(app)
        .post(`/calculation/${prisonerNumber}/summary/123456`)
        .type('form')
        .send({ agreeWithDates: 'YES' })
        .expect(302)
        .expect('Location', `/calculation/${prisonerNumber}/complete/654321`)
        .expect(res => {
          expect(res.redirect).toBeTruthy()
        })
    })
  })
})

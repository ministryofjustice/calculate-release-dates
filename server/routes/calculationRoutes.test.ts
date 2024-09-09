import request from 'supertest'
import type { Express } from 'express'
import { HttpError } from 'http-errors'
import MockDate from 'mockdate'
import * as cheerio from 'cheerio'
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
import { expectMiniProfile } from './testutils/layoutExpectations'
import { ResultsWithBreakdownAndAdjustments } from '../@types/calculateReleaseDates/rulesWithExtraAdjustments'
import UserPermissionsService from '../services/userPermissionsService'
import config from '../config'
import { FullPageError } from '../types/FullPageError'

jest.mock('../services/userService')
jest.mock('../services/calculateReleaseDatesService')
jest.mock('../services/prisonerService')
jest.mock('../services/userInputService')
jest.mock('../services/viewReleaseDatesService')
jest.mock('../services/userPermissionsService')

const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const userService = new UserService(null, prisonerService) as jest.Mocked<UserService>
const calculateReleaseDatesService = new CalculateReleaseDatesService() as jest.Mocked<CalculateReleaseDatesService>
const userInputService = new UserInputService() as jest.Mocked<UserInputService>
const viewReleaseDatesService = new ViewReleaseDatesService() as jest.Mocked<ViewReleaseDatesService>
const userPermissionsService = new UserPermissionsService() as jest.Mocked<UserPermissionsService>

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
      },
    ],
  },
  approvedDates: {},
  tranche: 'TRANCHE_1',
}

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      userService,
      prisonerService,
      calculateReleaseDatesService,
      userInputService,
      viewReleaseDatesService,
      userPermissionsService,
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
  config.featureToggles.showBreakdown = true
})

describe('Check access tests', () => {
  const runTest = async routes => {
    await Promise.all(
      routes.map(route =>
        request(app)
          [route.method.toLowerCase()](route.url)
          .expect(404)
          .expect('Content-Type', /html/)
          .expect(res => {
            expect(res.text).toContain('The details for this person cannot be found')
          }),
      ),
    )
  }

  it('Check urls no access when not in caseload', async () => {
    prisonerService.getPrisonerDetail.mockImplementation(() => {
      throw FullPageError.notInCaseLoadError()
    })
    prisonerService.checkPrisonerAccess.mockImplementation(() => {
      throw FullPageError.notInCaseLoadError()
    })

    const routes = [
      { method: 'GET', url: '/calculation/A1234AB/cancelCalculation' },
      { method: 'GET', url: '/calculation/A1234AB/123456/confirmation' },
      { method: 'GET', url: '/calculation/A1234AB/complete/123456' },
      { method: 'POST', url: '/calculation/A1234AB/cancelCalculation' },
    ]

    await runTest(routes)
  })
})

describe('Calculation routes tests', () => {
  it('GET /calculation/A1234AB/cancelCalculation should render the page', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .get('/calculation/A1234AB/cancelCalculation?redirectUrl=/calculation/A1234AB/123456/confirmation')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const confirmButton = $('[data-qa=confirm]').first()
        expect(confirmButton.length).toStrictEqual(1)
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })
  it('POST /calculation/A1234AB/cancelCalculation should redirect to the redirect URL when "No" is selected', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .post('/calculation/A1234AB/cancelCalculation')
      .send({
        _csrf: 'csrfToken',
        redirectUrl: '/calculation/A1234AB/123456/confirmation',
        cancelQuestion: 'no',
      })
      .expect(302)
      .expect('Location', '/calculation/A1234AB/123456/confirmation')
  })
  it('POST /calculation/A1234AB/cancelCalculation should redirect to the landing page when "Yes" is selected', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .post('/calculation/A1234AB/cancelCalculation')
      .send({
        _csrf: 'csrfToken',
        redirectUrl: '/calculation/A1234AB/123456/confirmation',
        cancelQuestion: 'yes',
      })
      .expect(302)
      .expect('Location', '/?prisonId=A1234AB')
  })
  it('POST /calculation/A1234AB/cancelCalculation should render error page when no option is selected', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .post('/calculation/A1234AB/cancelCalculation')
      .send({
        _csrf: 'csrfToken',
        redirectUrl: '/calculation/A1234AB/123456/confirmation',
      })
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const confirmButton = $('[data-qa=confirm]').first()
        expect(confirmButton.length).toStrictEqual(1)
        expectMiniProfile(res.text, expectedMiniProfile)
        expect(res.text).toContain("Please select either 'Yes' or 'No'")
      })
  })
  it('GET /calculation/A1234AB/123456/confirmation should return details about the calculation requested', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue(
      stubbedResultsWithBreakdownAndAdjustments,
    )
    return request(app)
      .get('/calculation/A1234AB/123456/confirmation')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-qa=cancel-link]').first().attr('href')).toStrictEqual(
          '/calculation/A1234AA/cancelCalculation?redirectUrl=/calculation/A1234AB/123456/confirmation',
        )
        const submitToNomis = $('[data-qa=submit-to-nomis]').first()
        expect(submitToNomis.length).toStrictEqual(1)
      })
  })
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
        expect(res.text).not.toContain('From 16 January, the policy for calculating ERSED has changed')
        expectMiniProfile(res.text, expectedMiniProfile)
        expect(res.text).not.toContain(
          'Early removal cannot happen as release from the Detention Training Order (DTO) is later than the Conditional Release Date (CRD).',
        )
        expect(res.text).toContain('Calculation breakdown')
        const $ = cheerio.load(res.text)
        expect($('[data-qa=cancel-link]').first().attr('href')).toStrictEqual(
          '/calculation/A1234AA/cancelCalculation?redirectUrl=/calculation/A1234AB/summary/123456',
        )
        const submitToNomis = $('[data-qa=submit-to-nomis]').first()
        expect(submitToNomis.attr('href')).toStrictEqual('/calculation/A1234AA/123456/approved-dates-question')
      })
  })

  it('GET /calculation/:nomsId/summary/:calculationRequestId should hide breakdown if feature toggle is off', () => {
    config.featureToggles.showBreakdown = false
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue(
      stubbedResultsWithBreakdownAndAdjustments,
    )
    return request(app)
      .get('/calculation/A1234AB/summary/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('Calculation breakdown')
      })
  })
  it('GET /calculation/:nomsId/summary/:calculationRequestId should show ERSED recall notification banner if recall only', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
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
          },
        ],
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
    const stubbedCalculationBreakdownWithErsedBanner: CalculationBreakdown = {
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
    calculateReleaseDatesService.hasIndeterminateSentences.mockResolvedValue(false)
    return request(app)
      .get('/calculation/A1234AB/complete/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const backToDpsLink = $('[data-qa=back-to-dps-search-link]').first()
        const courtCaseAndReleaseDatesLink = $('[data-qa=ccard-overview-link]').first()
        const prisonerProfileLink = $('[data-qa=prisoner-profile-link]').first()
        const prisonerNotificationSlipLink = $('[data-qa=prisoner-notification-slip-link]').first()

        expect(backToDpsLink.length).toStrictEqual(1)
        expect(backToDpsLink.text()).toStrictEqual('DPS homepage')
        expect(backToDpsLink.attr('href')).toStrictEqual('http://localhost:3000/dps')

        expect(courtCaseAndReleaseDatesLink.length).toStrictEqual(1)
        expect(courtCaseAndReleaseDatesLink.text()).toStrictEqual('Court case and release dates information')
        expect(courtCaseAndReleaseDatesLink.attr('href')).toStrictEqual(
          'http://localhost:3100/prisoner/A1234AA/overview',
        )

        expect(prisonerNotificationSlipLink.attr('href')).toStrictEqual(
          '/calculation/A1234AA/summary/123456/printNotificationSlip?fromPage=calculation',
        )

        expect(prisonerProfileLink.length).toStrictEqual(1)
        expect(prisonerProfileLink.text()).toStrictEqual('Prisoner profile')
        expect(prisonerProfileLink.attr('href')).toStrictEqual('http://localhost:3000/dps/prisoner/A1234AA')

        expect(res.text).toContain('Calculation complete')
        expect(res.text).toContain('The calculation has been saved in NOMIS.')
        expect(res.text).toContain('You can also go back to Anon Nobody&#39;s')
        expect(res.text).toContain('Help improve this service')
        expect(res.text).toContain(
          'This is a new service. Your feedback will help make it better. To give feedback you can:',
        )
        expect(userInputService.resetCalculationUserInputForPrisoner).toBeCalledWith(expect.anything(), 'A1234AB')
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })

  it('GET /calculation/:nomsId/complete should have print slip link', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationResults.mockResolvedValue(stubbedCalculationResults)
    calculateReleaseDatesService.hasIndeterminateSentences.mockResolvedValue(false)
    return request(app)
      .get('/calculation/A1234AB/complete/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const prisonerNotificationSlipLink = $('[data-qa=prisoner-notification-slip-link]').first()

        expect(prisonerNotificationSlipLink).toHaveLength(1)
        expect(userInputService.resetCalculationUserInputForPrisoner).toBeCalledWith(expect.anything(), 'A1234AB')
      })
  })

  it('GET /calculation/:nomsId/complete should not render print notification slip link', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationResults.mockResolvedValue(stubbedCalculationResults)
    calculateReleaseDatesService.hasIndeterminateSentences.mockResolvedValue(true)
    return request(app)
      .get('/calculation/A1234AB/complete/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const prisonerNotificationSlipLink = $('[data-qa=prisoner-notification-slip-link]').first()
        const alsoGoBackSpan = $('[data-qa=also-go-back]').first()

        expect(alsoGoBackSpan.text()).toStrictEqual("You can go back to Anon Nobody's:")
        expect(prisonerNotificationSlipLink.length).toBe(0)
      })
  })
  it('GET /calculation/:nomsId/complete should not render print notification slip link', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationResults.mockResolvedValue(stubbedCalculationResults)
    calculateReleaseDatesService.hasIndeterminateSentences.mockResolvedValue(true)
    return request(app)
      .get('/calculation/A1234AB/complete/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const prisonerNotificationSlipLink = $('[data-qa=prisoner-notification-slip-link]').first()
        const alsoGoBackSpan = $('[data-qa=also-go-back]').first()

        expect(alsoGoBackSpan.text()).toStrictEqual("You can go back to Anon Nobody's:")
        expect(prisonerNotificationSlipLink.length).toBe(0)
      })
  })

  it('GET /calculation/:nomsId/complete return pluralised version of prisoners name correctly when name ends with s', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue({ ...stubbedPrisonerData, lastName: 'Bloggs' })
    calculateReleaseDatesService.getCalculationResults.mockResolvedValue(stubbedCalculationResults)
    calculateReleaseDatesService.hasIndeterminateSentences.mockResolvedValue(false)
    return request(app)
      .get('/calculation/A1234AB/complete/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('You can also go back to Anon Bloggs')
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
    userPermissionsService.allowSpecialistSupportFeatureAccess.mockReturnValue(true)
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
  it('GET /calculation/:nomsId/summary/:calculationRequestId should display the SDS40 Tranche', () => {
    config.featureToggles.showSDS40TrancheLabel = true
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue(
      stubbedResultsWithBreakdownAndAdjustments,
    )
    return request(app)
      .get('/calculation/A1234AB/summary/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const trancheSelector = $('[data-qa=sds-early-release-tranche]').first()
        expect(trancheSelector.text()).toStrictEqual('SDS40 Tranche 1')
      })
  })

  it('GET /calculation/:nomsId/summary/:calculationRequestId should not display tranche label when tranche is 0', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    const dataWithTranche0 = { ...stubbedResultsWithBreakdownAndAdjustments }
    dataWithTranche0.tranche = 'TRANCHE_0'
    calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue(dataWithTranche0)
    return request(app)
      .get('/calculation/A1234AB/summary/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const trancheSelector = $('[data-qa=sds-early-release-tranche]').first()
        expect(trancheSelector.length).toBe(0)
      })
  })

  it('GET /calculation/:nomsId/summary/:calculationRequestId should not display tranche label when feature toggle is off', () => {
    config.featureToggles.showSDS40TrancheLabel = false
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    const dataWithTranche1 = { ...stubbedResultsWithBreakdownAndAdjustments }
    dataWithTranche1.tranche = 'TRANCHE_1'
    calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue(dataWithTranche1)
    return request(app)
      .get('/calculation/A1234AB/summary/123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const trancheSelector = $('[data-qa=sds-early-release-tranche]').first()
        expect(trancheSelector.length).toBe(0)
      })
  })
})

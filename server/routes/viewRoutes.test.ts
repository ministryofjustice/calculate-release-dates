import request from 'supertest'
import type { Express } from 'express'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import PrisonerService from '../services/prisonerService'
import UserService from '../services/userService'
import {
  AnalysedPrisonApiBookingAndSentenceAdjustments,
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
  ReleaseDatesAndCalculationContext,
  SentenceAndOffenceWithReleaseArrangements,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ReleaseDateWithAdjustments from '../@types/calculateReleaseDates/releaseDateWithAdjustments'
import { expectMiniProfile, expectNoMiniProfile } from './testutils/layoutExpectations'
import { ResultsWithBreakdownAndAdjustments } from '../@types/calculateReleaseDates/rulesWithExtraAdjustments'
import config from '../config'
import { FullPageError } from '../types/FullPageError'
import AuditService from '../services/auditService'

jest.mock('../services/userService')
jest.mock('../services/calculateReleaseDatesService')
jest.mock('../services/prisonerService')
jest.mock('../services/viewReleaseDatesService')
jest.mock('../services/auditService')

const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const userService = new UserService(null, prisonerService) as jest.Mocked<UserService>
const auditService = new AuditService() as jest.Mocked<AuditService>
const calculateReleaseDatesService = new CalculateReleaseDatesService(
  auditService,
) as jest.Mocked<CalculateReleaseDatesService>
const viewReleaseDatesService = new ViewReleaseDatesService() as jest.Mocked<ViewReleaseDatesService>

let app: Express

const pastNomisCalculation = {
  calculatedAt: '2022-01-01T00:00:00Z',
  reason: 'Some reason',
  prisonerDetail: {
    locationDescription: 'Inside - Leeds HMP',
  },
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
  calculationReason: { id: 1, displayName: 'A calculation reason', isOther: false },
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

const stubbedReleaseDatesUsingCalcReqId: ReleaseDatesAndCalculationContext = {
  calculation: {
    calculationRequestId: 51245,
    bookingId: 1201571,
    prisonerId: 'A8031DY',
    calculationStatus: 'CONFIRMED',
    calculationReference: 'fe1909af-c780-4b61-9ca3-a82678de5dca',
    calculationReason: {
      id: 8,
      isOther: false,
      displayName: 'A calculation reason',
    },
    otherReasonDescription: '',
    calculationDate: '2020-06-01',
    calculationType: 'CALCULATED',
    usePreviouslyRecordedSLEDIfFound: false,
  },
  dates: [
    {
      type: 'SED',
      description: 'Sentence expiry date',
      date: '2021-02-03',
      hints: [],
    },
    {
      type: 'CRD',
      description: 'Conditional release date',
      date: '2021-02-03',
      hints: [],
    },
    {
      type: 'HDCED',
      description: 'Home detention curfew eligibility date',
      date: '2021-10-03',
      hints: [],
    },
  ],
}

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
    usePreviouslyRecordedSLEDIfFound: false,
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
      { method: 'GET', url: '/view/A1234AA/nomis-calculation-summary/-1' },
      { method: 'GET', url: '/view/A1234AA/latest' },
      { method: 'GET', url: '/view/A1234AA/sentences-and-offences/123456' },
      { method: 'GET', url: '/view/A1234AA/calculation-summary/123456' },
      { method: 'GET', url: '/view/A1234AA/calculation-summary/123456/print' },
      { method: 'GET', url: '/view/A1234AA/calculation-summary/123456/printNotificationSlip?fromPage=view' },
      {
        method: 'GET',
        url: '/view/A1234AA/calculation-summary/123456/printNotificationSlip?fromPage=view&pageType=offender',
      },
      {
        method: 'GET',
        url: '/view/A1234AA/calculation-summary/123456/printNotificationSlip?fromPage=view&pageType=establishment',
      },
      { method: 'GET', url: '/calculation/A1234AA/summary/123456/printNotificationSlip?fromPage=calculation' },
      {
        method: 'GET',
        url: '/calculation/A1234AA/summary/123456/printNotificationSlip?fromPage=calculation&pageType=offender',
      },
      {
        method: 'GET',
        url: '/calculation/A1234AA/summary/123456/printNotificationSlip?fromPage=calculation&pageType=establishment',
      },
    ]

    await runTest(routes)
  })
})

describe('View journey routes tests', () => {
  describe('Profile banner tests - relating to persons that are OUT or not', () => {
    it('GET /view/:nomsId/nomis-calculation-summary/:offenderSentCalculationId should show personOutsideBanner when prisoner is OUT', () => {
      prisonerService.getPrisonerDetail.mockResolvedValue({ ...stubbedPrisonerData, agencyId: 'OUT' })
      calculateReleaseDatesService.getNomisCalculationSummary.mockResolvedValue(pastNomisCalculation as never)

      return request(app)
        .get('/view/A1234AA/nomis-calculation-summary/-1')
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const text = $('[data-qa=personOutsideBanner]').text().replace(/\s\s+/g, ' ').trim() // Remove space
          expect(text).toBe('This person has been released Some information may be hidden')
        })
    })

    it('GET /view/:nomsId/nomis-calculation-summary/:offenderSentCalculationId should show personOutsideBanner when prisoner is TRN', () => {
      prisonerService.getPrisonerDetail.mockResolvedValue({ ...stubbedPrisonerData, agencyId: 'TRN' })
      calculateReleaseDatesService.getNomisCalculationSummary.mockResolvedValue(pastNomisCalculation as never)

      return request(app)
        .get('/view/A1234AA/nomis-calculation-summary/-1')
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const text = $('[data-qa=personTransferredBanner]').text().replace(/\s\s+/g, ' ').trim() // Remove space
          expect(text).toBe('This person has been transferred Some information may be hidden')
        })
    })

    it('GET /view/:nomsId/nomis-calculation-summary/:offenderSentCalculationId should not show personOutsideBanner when prisoner is OUT', () => {
      prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      calculateReleaseDatesService.getNomisCalculationSummary.mockResolvedValue(pastNomisCalculation as never)

      return request(app)
        .get('/view/A1234AA/nomis-calculation-summary/-1')
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-qa=personOutsideBanner]').length).toBe(0)
        })
    })
  })

  describe('Get nomis calculation summary view tests', () => {
    it('GET /view/:nomsId/nomis-calculation-summary/:offenderSentCalculationId should have the correct details', () => {
      prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      calculateReleaseDatesService.getNomisCalculationSummary.mockResolvedValue(pastNomisCalculation as never)
      return request(app)
        .get('/view/A1234AA/nomis-calculation-summary/-1')
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-qa=calculation-title]').text()).toStrictEqual('Calculation details')
          expect($('[data-qa=calculation-date]').text()).toStrictEqual('01 January 2022')
          expect($('[data-qa=calculation-reason]').text()).toStrictEqual('Some reason')
          expect($('[data-qa=calculation-location-description]').text()).toStrictEqual('Not entered')
          expect($('[data-qa=calculation-source]').text().trim()).toStrictEqual('NOMIS')
          expect($('[data-qa=calculation-date-title]').text()).toStrictEqual('Date of calculation')
          expect($('[data-qa=calculation-reason-title]').text()).toStrictEqual('Reason')
          expect($('[data-qa=calculation-establishment-title]').text()).toStrictEqual('Establishment')
          expect($('[data-qa=calculation-source-title]').text()).toStrictEqual('Source')
          expect($('[data-qa=HDCED-date]').text().trim()).toContain('Sunday, 12 May 2024')
          expect($('[data-qa=HDCED-short-name]').text().trim()).toContain('HDCED')
          expect($('[data-qa=HDCED-full-name]').text().trim()).toStrictEqual('Home detention curfew eligibility date')
          expect($('[data-qa=mini-profile-prisoner-number]').text().trim()).toStrictEqual('A1234AA')
          expect($('[data-qa=HDCED-release-date-hint-0]').text()).toStrictEqual(
            'Friday, 10 May 2024 when adjusted to a working day',
          )
        })
    })

    it('GET /view/:nomsId/nomis-calculation-summary/:offenderSentCalculationId should show correct hint text with link when it relates to HDC policy', () => {
      prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      calculateReleaseDatesService.getNomisCalculationSummary.mockResolvedValue({
        ...pastNomisCalculation,
        releaseDates: pastNomisCalculation.releaseDates.map(releaseDate => ({
          ...releaseDate,
          hints: [
            {
              text: 'New hint text here with HDC policy',
              link: 'https://example.com',
            },
          ],
        })),
      } as never)

      return request(app)
        .get('/view/A1234AA/nomis-calculation-summary/-1')
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-qa=HDCED-release-date-hint-0]').text()).toStrictEqual('HDC policy')
          expect($('[data-qa=HDCED-release-date-hint-0]').first().attr('href')).toStrictEqual('https://example.com')
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
      calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue(
        stubbedResultsWithBreakdownAndAdjustments,
      )
      return request(app)
        .get('/view/A1234AA/sentences-and-offences/123456')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-qa=123-title]').text()).toStrictEqual('123 - Doing a crime')
          expect($('[data-qa=sub-nav-calc-summary]').first().attr('href')).toStrictEqual(
            '/view/A1234AA/calculation-summary/123456',
          )
          expect($('[data-qa=sub-nav-sent-and-off]').first().attr('href')).toStrictEqual(
            '/view/A1234AA/sentences-and-offences/123456',
          )
          expect($('[data-qa=sentAndOff-title]').text()).toStrictEqual('Calculation details')
          expect(res.text).toContain('A1234AA')
          expect(res.text).toContain('Anon')
          expect(res.text).toContain('Nobody')
          expect(res.text).not.toContain('This calculation will include 6')
          expect(res.text).not.toContain('sentences from NOMIS.')
          expect(res.text).toContain('Court case 1')
          expect(res.text).toContain('Committed on 03 February 2021')
          expect(res.text).toContain('Committed from 04 January 2021 to 05 January 2021')
          expect(res.text).toContain('Committed on 06 March 2021')
          expect(res.text).toContain('Offence date not entered')
          expect(res.text).toContain('Committed on 07 January 2021')
          expect(res.text).toContain('SDS Standard Sentence')
          expect(res.text).toContain('Court case 2')
          expect(res.text).toContain('Consecutive to court case 1 NOMIS line number 1')
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

    it('GET /view/:calculationRequestId/sentences-and-offences should show details if the calculation reason is OTHER', () => {
      viewReleaseDatesService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
      viewReleaseDatesService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedAdjustments)
      viewReleaseDatesService.getCalculationUserInputs.mockResolvedValue(stubbedUserInput)
      calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue({
        ...stubbedResultsWithBreakdownAndAdjustments,
        context: {
          ...stubbedResultsWithBreakdownAndAdjustments.context,
          calculationReason: { id: 2, displayName: 'Other', isOther: true },
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
          expect(res.text).toContain('Calculation reason')
          expect(res.text).toContain('A calculation reason')
          expect(res.text).toContain('01 June 2020')
          expect(res.text).toContain('/?prisonId=A1234AA')
          expect(res.text).toContain('Why are some details missing?')
          expect(res.text).toContain('How are final release dates calculated?')
          expectMiniProfile(res.text, expectedMiniProfile)
        })
    })

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
          expect(res.text).toContain('Calculation reason')
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
          calculationReason: { id: 2, displayName: 'Other', isOther: true },
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
            offence: {
              offenderChargeId: 1,
              offenceEndDate: '2021-02-03',
              offenceCode: '123',
              offenceDescription: '',
              indicators: [],
            },
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
        expect(res.text).toMatch(/<script src="\/assets\/print.js"><\/script>/)
        expect(res.text).toMatch(/Dates for/)
        expectMiniProfile(res.text, expectedMiniProfile)
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
  describe('Print Notification slip', () => {
    it('GET /view/:nomsId/calculation-summary/:calculationRequestId/printNotificationSlip?fromPage=view should generate page', () => {
      const stubbedSentencesAndOffencesLocal = [
        {
          terms: [
            {
              years: 3,
              code: 'IMP',
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
              years: 2,
            },
          ],
          sentenceDate: '2010-02-03',
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
      viewReleaseDatesService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffencesLocal)
      viewReleaseDatesService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedAdjustments)
      calculateReleaseDatesService.getReleaseDatesForACalcReqId.mockResolvedValue(stubbedReleaseDatesUsingCalcReqId)
      return request(app)
        .get('/view/A1234AA/calculation-summary/123456/printNotificationSlip?fromPage=view')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const backLink = $('[data-qa=back-link]').first()
          const offenderSlipBtn = $('[data-qa=slip-offender-copy]').first()
          const establishmentSlipBtn = $('[data-qa=slip-establishment-copy]').first()
          const pageTitle = $('[data-qa=page-title]').first()
          const prisonTitle = $('[data-qa=prison-name]').first()
          const prisonerName = $('[data-qa=prisoner-name]').first()
          const prisonerCell = $('[data-qa=prisoner-cell]').first()
          const offenderNumber = $('[data-qa=offender-number]').first()
          const calculationDate = $('[data-qa=calculation-date]').first()
          const releaseDatesTitle = $('[data-qa=release-date-title]').first()
          const crdTitle = $('[data-qa=CRD-title]').first()
          const crdDate = $('[data-qa=CRD-date]').first()
          const sedTitle = $('[data-qa=SED-title]').first()
          const sedDate = $('[data-qa=SED-date]').first()
          const hdcedTitle = $('[data-qa=HDCED-title]').first()
          const hdcedDate = $('[data-qa=HDCED-date]').first()
          const sentenceTitle = $('[data-qa=sentence-title]').first()
          const sentenceColTitle = $('[data-qa=sentence-col-title]').first()
          const sentenceColDate = $('[data-qa=sentence-col-date]').first()
          const sentenceColLength = $('[data-qa=sentence-col-length]').first()
          const sentence11Title = $('[data-qa=sentence-1-1-title]').first()
          const sentence11Date = $('[data-qa=sentence-1-1-date]').first()
          const sentence11Length = $('[data-qa=sentence-1-1-length]').first()
          const sentence22Title = $('[data-qa=sentence-2-2-title]').first()
          const sentence22Date = $('[data-qa=sentence-2-2-date]').first()
          const sentence22Length = $('[data-qa=sentence-2-2-length]').first()
          const adjustTitle = $('[data-qa=adjust-title]').first()
          const adjustDesc = $('[data-qa=adjust-desc]').first()
          const adjustColType = $('[data-qa=adjust-col-type]').first()
          const adjustColFrom = $('[data-qa=adjust-col-from]').first()
          const adjustColTo = $('[data-qa=adjust-col-to]').first()
          const adjustColDays = $('[data-qa=adjust-col-days]').first()
          const ulalName = $('[data-qa="Unlawfully at large-name"]').first()
          const ulalFrom = $('[data-qa="Unlawfully at large-from"]').first()
          const ulalTo = $('[data-qa="Unlawfully at large-to"]').first()
          const ulalDays = $('[data-qa="Unlawfully at large-days"]').first()
          const remandName = $('[data-qa=Remand-name]').first()
          const remandFrom = $('[data-qa=Remand-from]').first()
          const remandTo = $('[data-qa=Remand-to]').first()
          const remandDays = $('[data-qa=Remand-days]').first()
          const appealCustody = $('[data-qa=appeal-custody]').first()
          const appealBail = $('[data-qa=appeal-bail]').first()
          const offenderSlipLink = $('[data-qa="slip-offender-copy"]').first()
          const establishmentSlipLink = $('[data-qa="slip-establishment-copy"]').first()
          const daysInUnusedRemand = $('[data-qa=days-in-unusedRemand]').first()
          const offenderHDCED = $('[data-qa="offender-hdced-text"]').first()
          const calcReasonTitle = $('[data-qa="calculation-reason-title"]')
          const calcReason = $('[data-qa="calculation-reason"]')

          expect(offenderSlipLink.attr('href')).toStrictEqual(
            '/view/A1234AA/calculation-summary/123456/printNotificationSlip?fromPage=view&pageType=offender',
          )
          expect(establishmentSlipLink.attr('href')).toStrictEqual(
            '/view/A1234AA/calculation-summary/123456/printNotificationSlip?fromPage=view&pageType=establishment',
          )
          expect(backLink.attr('href')).toStrictEqual('/?prisonId=A1234AA')
          expect(offenderSlipBtn.text()).toContain('Print notification slip')
          expect(establishmentSlipBtn.text()).toContain('Print establishment copy')
          expect(pageTitle.text()).toContain('Release dates notification slip')
          expect(prisonTitle.text()).toContain('Foo Prison (HMP)')
          expect(prisonerName.text()).toContain('Anon Nobody')
          expect(prisonerCell.text()).toContain('D-2-003')
          expect(offenderNumber.text()).toContain('A1234AA')
          expect(releaseDatesTitle.text()).toContain('Release dates')
          expect(calculationDate.text()).toStrictEqual('These release dates were calculated on 01 June 2020.')
          expect(crdTitle.text()).toContain('CRD (Conditional release date)')
          expect(crdDate.text()).toContain('03 February 2021')
          expect(sedTitle.text()).toContain('SED (Sentence expiry date)')
          expect(sedDate.text()).toContain('03 February 2021')
          expect(hdcedTitle.text()).toContain('HDCED (Home detention curfew eligibility date)')
          expect(hdcedDate.text()).toContain('03 October 2021')
          expect(sentenceTitle.text()).toContain('Sentence details')
          expect(sentenceColTitle.text()).toContain('Sentence')
          expect(sentenceColDate.text()).toContain('Sentence start date')
          expect(sentenceColLength.text()).toContain('Sentence length')
          expect(sentence11Title.text()).toContain('Court case 1, NOMIS line number 1')
          expect(sentence11Date.text()).toContain('03 February 2004')
          expect(sentence22Title.text()).toContain('Court case 2, NOMIS line number 2')
          expect(sentence22Date.text()).toContain('03 February 2010')
          expect(sentence11Length.text().trim()).toContain('3')
          expect(sentence11Length.text().trim()).toContain('years')
          expect(sentence22Length.text().trim()).toContain('2')
          expect(sentence22Length.text().trim()).toContain('years')
          expect(sentence22Length.text().trim()).toContain('consecutive to court case 1 NOMIS line number 1')
          expect(adjustTitle.text()).toContain('Adjustments')
          expect(adjustDesc.text()).toContain('This calculation includes the following adjustments to sentences.')
          expect(adjustColType.text()).toContain('Adjustment type')
          expect(adjustColFrom.text()).toStrictEqual('Date from (if applicable)')
          expect(adjustColTo.text()).toStrictEqual('Date to (if applicable)')
          expect(adjustColDays.text()).toContain('Days')
          expect(ulalName.text()).toContain('Unlawfully at large')
          expect(ulalFrom.text()).toContain('07 March 2021')
          expect(ulalTo.text()).toContain('08 March 2021')
          expect(ulalDays.text()).toContain('2 days added')
          expect(remandName.text()).toContain('Remand')
          expect(remandFrom.text()).toContain('01 February 2021')
          expect(remandTo.text()).toContain('02 February 2021')
          expect(remandDays.text()).toContain('2 days deducted')
          expect(daysInUnusedRemand.length).toStrictEqual(0)
          expect(offenderHDCED.length).toStrictEqual(0)
          expect(appealCustody.text()).toContain(
            'Days spent in custody pending appeal to count (must be completed manually):',
          )
          expect(appealBail.text()).toContain(
            'Days spent on bail pending appeal not to count (must be completed manually):',
          )
          expect(calcReasonTitle.text()).toContain('Calculation reason')
          expect(calcReason.text()).toContain('A calculation reason')
        })
    })

    it('GET /view/:nomsId/calculation-summary/:calculationRequestId/printNotificationSlip?fromPage=view&pageType=offender should have correct content for pageType Offender', () => {
      viewReleaseDatesService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
      viewReleaseDatesService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedAdjustments)
      calculateReleaseDatesService.getReleaseDatesForACalcReqId.mockResolvedValue(stubbedReleaseDatesUsingCalcReqId)
      return request(app)
        .get('/view/A1234AA/calculation-summary/123456/printNotificationSlip?fromPage=view&pageType=offender')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const pageTitleCaption = $('[data-qa="page-title-caption"]').first()
          const offenderDisagreeText = $('[data-qa="offender-disagree-text"]').first()
          const calculatedBy = $('[data-qa="calculated-by"]')
          const checkedBy = $('[data-qa="checked-by"]')
          const calcReasonTitle = $('[data-qa="calculation-reason-title"]')
          const calcReason = $('[data-qa="calculation-reason"]')
          const printInvoker = $('[data-qa="print-invoker"]').first()
          const offenderHDCED = $('[data-qa="offender-hdced-text"]').first()

          expect(printInvoker.attr('src')).toStrictEqual('/assets/print.js')
          expect(calculatedBy.length).toStrictEqual(0)
          expect(calcReasonTitle.text()).toContain('Calculation reason')
          expect(calcReason.text()).toContain('A calculation reason')
          expect(checkedBy.length).toStrictEqual(0)
          expect(pageTitleCaption.text()).toStrictEqual("[Anon Nobody's copy]")
          expect(offenderHDCED.text()).toStrictEqual(
            'Release on HDC (Home Detention Curfew) is subject to an assessment.',
          )
          expect(offenderDisagreeText.text()).toStrictEqual(
            'If you disagree with the above dates, please write down what you think the dates should be and hand to your wing office.',
          )
        })
    })

    it('GET /view/:nomsId/calculation-summary/:calculationRequestId/printNotificationSlip?fromPage=view&pageType=establishment should have correct content for pageType Establishment', () => {
      viewReleaseDatesService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
      viewReleaseDatesService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedAdjustments)
      calculateReleaseDatesService.getReleaseDatesForACalcReqId.mockResolvedValue(stubbedReleaseDatesUsingCalcReqId)
      return request(app)
        .get('/view/A1234AA/calculation-summary/123456/printNotificationSlip?fromPage=view&pageType=establishment')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const pageTitleCaption = $('[data-qa="page-title-caption"]').first()
          const offenderDisagreeText = $('[data-qa="offender-disagree-text"]')
          const calculatedBy = $('[data-qa="calculated-by"]').first()
          const checkedBy = $('[data-qa="checked-by"]').first()
          const calcReasonTitle = $('[data-qa="calculation-reason-title"]').first()
          const calcReason = $('[data-qa="calculation-reason"]').first()
          const printInvoker = $('[data-qa="print-invoker"]').first()
          const offenderHDCED = $('[data-qa="offender-hdced-text"]').first()

          expect(printInvoker.attr('src')).toStrictEqual('/assets/print.js')
          expect(calculatedBy.text()).toStrictEqual('Calculated by:')
          expect(calcReasonTitle.text()).toContain('Calculation reason')
          expect(calcReason.text()).toContain('A calculation reason')
          expect(checkedBy.text()).toStrictEqual('Checked by:')
          expect(pageTitleCaption.text()).toStrictEqual('[Establishment copy]')
          expect(offenderDisagreeText.length).toStrictEqual(0)
          expect(offenderHDCED.length).toStrictEqual(0)
        })
    })

    it('GET /calculation/:nomsId/summary/:calculationRequestId/printNotificationSlip?fromPage=calculation should generate page', () => {
      viewReleaseDatesService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
      viewReleaseDatesService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedAdjustments)
      calculateReleaseDatesService.getReleaseDatesForACalcReqId.mockResolvedValue(stubbedReleaseDatesUsingCalcReqId)
      return request(app)
        .get('/calculation/A1234AA/summary/123456/printNotificationSlip?fromPage=calculation')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const backLink = $('[data-qa=back-link]').first()
          const offenderSlipLink = $('[data-qa="slip-offender-copy"]').first()
          const establishmentSlipLink = $('[data-qa="slip-establishment-copy"]').first()

          expect(backLink.attr('href')).toStrictEqual('/calculation/A1234AA/complete/123456')
          expect(offenderSlipLink.attr('href')).toStrictEqual(
            '/calculation/A1234AA/summary/123456/printNotificationSlip?fromPage=calculation&pageType=offender',
          )
          expect(establishmentSlipLink.attr('href')).toStrictEqual(
            '/calculation/A1234AA/summary/123456/printNotificationSlip?fromPage=calculation&pageType=establishment',
          )
        })
    })

    it('GET /calculation/:nomsId/summary/:calculationRequestId/printNotificationSlip?fromPage=view&pageType=offender should generate page without HDCED text', () => {
      const stubbedReleaseDatesWithoutHDCED: ReleaseDatesAndCalculationContext = {
        calculation: {
          calculationRequestId: 51245,
          bookingId: 1201571,
          prisonerId: 'A8031DY',
          calculationStatus: 'CONFIRMED',
          calculationReference: 'fe1909af-c780-4b61-9ca3-a82678de5dca',
          calculationReason: {
            id: 8,
            isOther: false,
            displayName: 'A calculation reason',
          },
          otherReasonDescription: '',
          calculationDate: '2020-06-01',
          calculationType: 'CALCULATED',
          usePreviouslyRecordedSLEDIfFound: false,
        },
        dates: [
          {
            type: 'SED',
            description: 'Sentence expiry date',
            date: '2021-02-03',
            hints: [],
          },
          {
            type: 'CRD',
            description: 'Conditional release date',
            date: '2021-02-03',
            hints: [],
          },
        ],
      }
      viewReleaseDatesService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
      viewReleaseDatesService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedAdjustments)
      calculateReleaseDatesService.getReleaseDatesForACalcReqId.mockResolvedValue(stubbedReleaseDatesWithoutHDCED)
      return request(app)
        .get('/calculation/A1234AA/summary/123456/printNotificationSlip?fromPage=view&pageType=offender')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const offenderHDCED = $('[data-qa="offender-hdced-text"]').first()

          expect(offenderHDCED.length).toStrictEqual(0)
        })
    })

    it('GET /calculation/:nomsId/summary/:calculationRequestId/printNotificationSlip?fromPage=calculation should generate correct unused remand', () => {
      const stubbedAdjustmentsTB = {
        sentenceAdjustments: [
          {
            sentenceSequence: 1,
            type: 'TAGGED_BAIL',
            numberOfDays: 2,
            active: true,
          },
          {
            sentenceSequence: 2,
            type: 'UNUSED_REMAND',
            numberOfDays: 2,
            active: true,
          },
        ],
        bookingAdjustments: [],
      } as AnalysedPrisonApiBookingAndSentenceAdjustments
      viewReleaseDatesService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
      viewReleaseDatesService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedAdjustmentsTB)
      calculateReleaseDatesService.getReleaseDatesForACalcReqId.mockResolvedValue(stubbedReleaseDatesUsingCalcReqId)
      return request(app)
        .get('/calculation/A1234AA/summary/123456/printNotificationSlip?fromPage=calculation')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const daysInUnusedRemand = $('[data-qa=days-in-unusedRemand]').first()
          const taggedBailFrom = $('[data-qa="Tagged bail-from"]').first()
          const taggedBailTo = $('[data-qa="Tagged bail-to"]').first()
          const unusedRemandFrom = $('[data-qa="Unused remand-from"]').first()
          const unusedTo = $('[data-qa="Unused remand-to"]').first()

          expect(daysInUnusedRemand.text()).toStrictEqual('There are 2 days of unused deductions.')
          expect(taggedBailFrom.text()).toStrictEqual('')
          expect(unusedRemandFrom.text()).toStrictEqual('')
          expect(taggedBailTo.text()).toStrictEqual('')
          expect(unusedTo.text()).toStrictEqual('')
        })
    })

    it('GET /calculation/:nomsId/summary/:calculationRequestId/printNotificationSlip?fromPage=calculation should terms - singular', () => {
      const stubbedSentencesAndOffencesLocal = [
        {
          terms: [
            {
              years: 1,
              months: 1,
              weeks: 1,
              days: 1,
              code: 'IMP',
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
      ]
      viewReleaseDatesService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffencesLocal)
      viewReleaseDatesService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedAdjustments)
      calculateReleaseDatesService.getReleaseDatesForACalcReqId.mockResolvedValue(stubbedReleaseDatesUsingCalcReqId)
      return request(app)
        .get('/calculation/A1234AA/summary/123456/printNotificationSlip?fromPage=calculation')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          let sentence11Length = $('[data-qa=sentence-1-1-length]').first().text()
          sentence11Length = sentence11Length.replace(/\s/g, '')

          expect(sentence11Length).toStrictEqual('1year1month1week1day')
        })
    })

    it('GET /calculation/:nomsId/summary/:calculationRequestId/printNotificationSlip?fromPage=calculation should terms - plural', () => {
      const stubbedSentencesAndOffencesLocal = [
        {
          terms: [
            {
              years: 2,
              months: 2,
              weeks: 2,
              days: 2,
              code: 'IMP',
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
      ]
      viewReleaseDatesService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffencesLocal)
      viewReleaseDatesService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedAdjustments)
      calculateReleaseDatesService.getReleaseDatesForACalcReqId.mockResolvedValue(stubbedReleaseDatesUsingCalcReqId)
      return request(app)
        .get('/calculation/A1234AA/summary/123456/printNotificationSlip?fromPage=calculation')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          let sentence11Length = $('[data-qa=sentence-1-1-length]').first().text()
          sentence11Length = sentence11Length.replace(/\s/g, '')

          expect(sentence11Length).toStrictEqual('2years2months2weeks2days')
        })
    })

    it('GET /calculation/:nomsId/summary/:calculationRequestId/printNotificationSlip?fromPage=calculation&pageType=offender should generate correct content for Offender Name, Agency Name, keyDates and Adjustments', () => {
      const stubbedNoReleaseDates: ReleaseDatesAndCalculationContext = {
        calculation: {
          calculationRequestId: 51245,
          bookingId: 1201571,
          prisonerId: 'A8031DY',
          calculationStatus: 'CONFIRMED',
          calculationReference: 'fe1909af-c780-4b61-9ca3-a82678de5dca',
          calculationReason: {
            id: 8,
            isOther: false,
            displayName: 'A calculation reason',
          },
          otherReasonDescription: '',
          calculationDate: '2020-06-01',
          calculationType: 'CALCULATED',
          usePreviouslyRecordedSLEDIfFound: false,
        },
        dates: [],
      }
      const stubbedNoAdjustments = {
        sentenceAdjustments: [],
        bookingAdjustments: [],
      } as AnalysedPrisonApiBookingAndSentenceAdjustments
      const stubbedNoPrisonPrisonerData = {
        offenderNo: 'A1234AA',
        firstName: 'Anon',
        lastName: 'Bloggs',
        sentenceDetail: {} as PrisonApiSentenceDetail,
        assignedLivingUnit: {} as PrisonAPIAssignedLivingUnit,
      } as PrisonApiPrisoner
      viewReleaseDatesService.getPrisonerDetail.mockResolvedValue(stubbedNoPrisonPrisonerData)
      viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
      viewReleaseDatesService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedNoAdjustments)
      calculateReleaseDatesService.getReleaseDatesForACalcReqId.mockResolvedValue(stubbedNoReleaseDates)
      return request(app)
        .get('/calculation/A1234AA/summary/123456/printNotificationSlip?fromPage=calculation&pageType=offender')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const noAdjustments = $('[data-qa=adjust-desc-no]').first()
          const prisonTitle = $('[data-qa=prison-name]').first()
          const prisonerCell = $('[data-qa=prisoner-cell]').first()
          const dtoTitle = $('[data-qa=dto-title]').first()
          const dtoText = $('[data-qa=dto-text]').first()
          const pageTitleCaption = $('[data-qa="page-title-caption"]').first()

          expect(pageTitleCaption.text()).toStrictEqual("[Anon Bloggs' copy]")
          expect(noAdjustments.text()).toStrictEqual('There are no adjustments.')
          expect(prisonTitle.text()).toContain('No agency name available')
          expect(prisonerCell.text()).toContain('No Cell Number available')
          expect(dtoTitle.length).toStrictEqual(0)
          expect(dtoText.length).toStrictEqual(0)
        })
    })

    it('GET /calculation/:nomsId/summary/:calculationRequestId/printNotificationSlip?fromPage=calculation should generate correct content for a DTO only sentence', () => {
      const stubbedSentencesAndOffencesLocal = [
        {
          terms: [
            {
              years: 2,
              months: 2,
              weeks: 2,
              days: 2,
              code: 'IMP',
            },
          ],
          sentenceDate: '2004-02-03',
          sentenceCalculationType: 'DTO',
          sentenceTypeDescription: 'Detention and Training Order',
          caseSequence: 1,
          lineSequence: 1,
          sentenceSequence: 1,
          offence: { offenceEndDate: '2021-02-03' },
          isSDSPlus: false,
        } as SentenceAndOffenceWithReleaseArrangements,
        {
          terms: [
            {
              years: 2,
              months: 2,
              weeks: 2,
              days: 2,
              code: 'IMP',
            },
          ],
          sentenceDate: '2004-02-03',
          sentenceCalculationType: 'DTO_ORA',
          sentenceTypeDescription: 'Detention and Training Order',
          caseSequence: 1,
          lineSequence: 1,
          sentenceSequence: 1,
          offence: { offenceEndDate: '2021-02-03' },
          isSDSPlus: false,
        } as SentenceAndOffenceWithReleaseArrangements,
      ]
      const stubbedNoAdjustments = {
        sentenceAdjustments: [],
        bookingAdjustments: [],
      } as AnalysedPrisonApiBookingAndSentenceAdjustments
      const stubbedNoPrisonPrisonerData = {
        sentenceDetail: {} as PrisonApiSentenceDetail,
        assignedLivingUnit: {} as PrisonAPIAssignedLivingUnit,
      } as PrisonApiPrisoner
      const stubbedReleaseDatesUsingCalcReqIdLocal: ReleaseDatesAndCalculationContext = {
        calculation: {
          calculationRequestId: 51245,
          bookingId: 1201571,
          prisonerId: 'A8031DY',
          calculationStatus: 'CONFIRMED',
          calculationReference: 'fe1909af-c780-4b61-9ca3-a82678de5dca',
          calculationReason: {
            id: 8,
            isOther: false,
            displayName: 'A calculation reason',
          },
          otherReasonDescription: '',
          calculationDate: '2020-06-01',
          calculationType: 'CALCULATED',
          usePreviouslyRecordedSLEDIfFound: false,
        },
        dates: [
          {
            type: 'LTD',
            description: 'Late transfer date',
            date: '2022-02-03',
            hints: [],
          },
          {
            type: 'ETD',
            description: 'Early transfer date',
            date: '2021-02-03',
            hints: [],
          },
          {
            type: 'MTD',
            description: 'Mid transfer date',
            date: '2021-10-03',
            hints: [],
          },
        ],
      }
      viewReleaseDatesService.getPrisonerDetail.mockResolvedValue(stubbedNoPrisonPrisonerData)
      viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffencesLocal)
      viewReleaseDatesService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedNoAdjustments)
      calculateReleaseDatesService.getReleaseDatesForACalcReqId.mockResolvedValue(
        stubbedReleaseDatesUsingCalcReqIdLocal,
      )
      return request(app)
        .get('/calculation/A1234AA/summary/123456/printNotificationSlip?fromPage=calculation')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const dtoTitle = $('[data-qa=dto-title]').first()
          const dtoText = $('[data-qa=dto-text]').first()
          const releaseDatesTitle = $('[data-qa=release-date-title]').first()
          const ltdTitle = $('[data-qa=LTD-title]').first()
          const ltdDate = $('[data-qa=LTD-date]').first()
          const etdTitle = $('[data-qa=ETD-title]').first()
          const etdDate = $('[data-qa=ETD-date]').first()
          const mtdTitle = $('[data-qa=MTD-title]').first()
          const mtdDate = $('[data-qa=MTD-date]').first()

          expect(ltdTitle.text()).toContain('LTD (Late transfer date)')
          expect(ltdDate.text()).toContain('03 February 2022')
          expect(etdTitle.text()).toContain('ETD (Early transfer date)')
          expect(etdDate.text()).toContain('03 February 2021')
          expect(mtdTitle.text()).toContain('MTD (Mid transfer date)')
          expect(mtdDate.text()).toContain('03 October 2021')
          expect(releaseDatesTitle.text()).toStrictEqual('Release dates')
          expect(dtoTitle.text()).toStrictEqual('DTO (Detention training order) dates')
          expect(dtoText.text()).toStrictEqual(
            'Your DTO sentence dates with all adjustments including any days spent unlawfully at large (UAL) and/or time served pending appeal (TSPA) are as follows:',
          )
        })
    })

    it('GET /view/:nomsId/calculation-summary/:calculationRequestId/printNotificationSlip?fromPage=view should handle no calculation reason', () => {
      const stubbedSentencesAndOffencesLocal = [
        {
          terms: [
            {
              years: 3,
              code: 'IMP',
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
              years: 2,
            },
          ],
          sentenceDate: '2010-02-03',
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
      viewReleaseDatesService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffencesLocal)
      viewReleaseDatesService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedAdjustments)
      calculateReleaseDatesService.getReleaseDatesForACalcReqId.mockResolvedValue(
        Object.assign(stubbedReleaseDatesUsingCalcReqId, {
          calculation: {
            calculationReason: null,
          },
        }),
      )
      return request(app)
        .get('/view/A1234AA/calculation-summary/123456/printNotificationSlip?fromPage=view')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const calcReason = $('[data-qa="calculation-reason"]')
          expect(calcReason.text().trim()).toStrictEqual('Not specified')
        })
    })
  })
})

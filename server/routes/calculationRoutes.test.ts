import request from 'supertest'
import type { Express } from 'express'
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
import ViewReleaseDatesService from '../services/viewReleaseDatesService'
import { expectMiniProfile } from './testutils/layoutExpectations'
import { ResultsWithBreakdownAndAdjustments } from '../@types/calculateReleaseDates/rulesWithExtraAdjustments'
import UserPermissionsService from '../services/userPermissionsService'
import config from '../config'
import { FullPageError } from '../types/FullPageError'
import AuditService from '../services/auditService'

jest.mock('../services/userService')
jest.mock('../services/calculateReleaseDatesService')
jest.mock('../services/prisonerService')
jest.mock('../services/userInputService')
jest.mock('../services/viewReleaseDatesService')
jest.mock('../services/userPermissionsService')
jest.mock('../services/auditService')

const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const userService = new UserService(null, prisonerService) as jest.Mocked<UserService>
const auditService = new AuditService() as jest.Mocked<AuditService>
const calculateReleaseDatesService = new CalculateReleaseDatesService(
  auditService,
) as jest.Mocked<CalculateReleaseDatesService>
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
  effectiveSentenceLength: null,
  prisonerId: 'A1234AB',
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
        revocationDates: [],
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
        revocationDates: [],
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
        revocationDates: [],
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
        expect(userInputService.resetCalculationUserInputForPrisoner).toHaveBeenCalledWith(expect.anything(), 'A1234AB')
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
        expect(userInputService.resetCalculationUserInputForPrisoner).toHaveBeenCalledWith(expect.anything(), 'A1234AB')
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
})

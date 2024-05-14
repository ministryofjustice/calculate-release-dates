import request from 'supertest'
import { Express } from 'express'
import nock from 'nock'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import UserPermissionsService from '../services/userPermissionsService'
import PrisonerService from '../services/prisonerService'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import {
  AnalysedSentenceAndOffence,
  BookingCalculation,
  CalculationBreakdown,
  CalculationSentenceUserInput,
  CalculationUserInputs,
  GenuineOverrideRequest,
  ManualEntrySelectedDate,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import {
  AnalyzedPrisonApiBookingAndSentenceAdjustments,
  PrisonAPIAssignedLivingUnit,
  PrisonApiPrisoner,
  PrisonApiReturnToCustodyDate,
  PrisonApiSentenceDetail,
} from '../@types/prisonApi/prisonClientTypes'
import config from '../config'
import { expectMiniProfile, expectNoMiniProfile } from './testutils/layoutExpectations'
import ViewReleaseDatesService from '../services/viewReleaseDatesService'
import SentenceAndOffenceViewModel from '../models/SentenceAndOffenceViewModel'
import CheckInformationService from '../services/checkInformationService'
import UserInputService from '../services/userInputService'
import ManualEntryService from '../services/manualEntryService'
import SessionSetup from './testutils/sessionSetup'
import { StorageResponseModel } from '../services/dateValidationService'
import { ResultsWithBreakdownAndAdjustments } from '../@types/calculateReleaseDates/rulesWithExtraAdjustments'

let app: Express
let fakeApi: nock.Scope
let sessionSetup: SessionSetup

jest.mock('../services/userPermissionsService')
jest.mock('../services/prisonerService')
jest.mock('../services/calculateReleaseDatesService')
jest.mock('../services/viewReleaseDatesService')
jest.mock('../services/userInputService')
jest.mock('../services/checkInformationService')
jest.mock('../services/manualEntryService')

const userPermissionsService = new UserPermissionsService() as jest.Mocked<UserPermissionsService>
const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const calculateReleaseDatesService = new CalculateReleaseDatesService() as jest.Mocked<CalculateReleaseDatesService>
const viewReleaseDatesService = new ViewReleaseDatesService() as jest.Mocked<ViewReleaseDatesService>
const userInputService = new UserInputService() as jest.Mocked<UserInputService>
const checkInformationService = new CheckInformationService(
  calculateReleaseDatesService,
  prisonerService,
  userInputService,
) as jest.Mocked<CheckInformationService>
const manualEntryService = new ManualEntryService(null, null, null) as jest.Mocked<ManualEntryService>

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
  calculationType: 'CALCULATED',
  calculationReference: 'ABC123',
  bookingId: 123,
  approvedDates: {},
} as BookingCalculation

const stubbedCalculationResultsWithReason = {
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
  calculationType: 'CALCULATED',
  calculationReference: 'ABC123',
  bookingId: 123,
  approvedDates: {},
  calculationReason: {
    id: 1,
    isOther: false,
    displayName: 'Transfer',
  },
} as BookingCalculation

const stubbedNewCalculationResults = {
  dates: {
    CRD: '2021-02-03',
    SED: '2021-02-03',
    HDCED: '2021-10-03',
    ERSED: '2020-02-03',
  },
  calculationRequestId: 987654,
  effectiveSentenceLength: {},
  prisonerId: 'A1234AB',
  calculationStatus: 'CONFIRMED',
  calculationType: 'CALCULATED',
  calculationReference: 'XYZ789',
  bookingId: 123,
  approvedDates: {},
  calculationReason: {
    id: 1,
    isOther: false,
    displayName: 'Transfer',
  },
} as BookingCalculation

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
    offence: { offenceEndDate: '2021-02-03' },
    isSDSPlus: false,
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
    offence: { offenceEndDate: '2021-02-03', offenceCode: '123', offenceDescription: 'Doing a crime' },
    isSDSPlus: true,
  } as AnalysedSentenceAndOffence,
]
const sentencesAndOffencesWithExclusions = [
  {
    terms: [
      {
        years: 3,
      },
    ],
    sentenceTypeDescription: 'SDS Standard Sentence',
    caseSequence: 1,
    lineSequence: 1,
    caseReference: 'CASE001',
    courtDescription: 'Court 1',
    sentenceSequence: 1,
    offence: { offenceEndDate: '2021-02-03', offenceDescription: 'SXOFFENCE' },
    sentenceAndOffenceAnalysis: 'NEW',
    isSDSPlus: true,
    hasAnSDSEarlyReleaseExclusion: 'SEXUAL',
  } as AnalysedSentenceAndOffence,
  {
    terms: [
      {
        years: 3,
      },
    ],
    sentenceTypeDescription: 'SDS Standard Sentence',
    caseSequence: 1,
    lineSequence: 2,
    caseReference: 'CASE001',
    courtDescription: 'Court 1',
    sentenceSequence: 1,
    offence: {
      offenceStartDate: '2021-01-04',
      offenceEndDate: '2021-01-05',
      offenceDescription: 'VIOOFFENCE',
    },
    sentenceAndOffenceAnalysis: 'NEW',
    isSDSPlus: true,
    hasAnSDSEarlyReleaseExclusion: 'VIOLENT',
  } as AnalysedSentenceAndOffence,
  {
    terms: [
      {
        years: 3,
      },
    ],
    sentenceTypeDescription: 'SDS Standard Sentence',
    caseSequence: 1,
    lineSequence: 3,
    caseReference: 'CASE001',
    courtDescription: 'Court 1',
    sentenceSequence: 1,
    offence: { offenceStartDate: '2021-03-06', offenceDescription: 'No exclusion offence' },
    sentenceAndOffenceAnalysis: 'NEW',
    isSDSPlus: true,
    hasAnSDSEarlyReleaseExclusion: 'NO',
  } as AnalysedSentenceAndOffence,
]

const stubbedUserInput = {
  sentenceCalculationUserInputs: [
    {
      userInputType: 'ORIGINAL',
      userChoice: true,
      offenceCode: 'RL05016',
      sentenceSequence: 3,
    } as CalculationSentenceUserInput,
    {
      userInputType: 'ORIGINAL',
      userChoice: true,
      offenceCode: 'RL05016',
      sentenceSequence: 3,
    } as CalculationSentenceUserInput,
  ],
} as CalculationUserInputs
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
    {
      sentenceSequence: 8,
      type: 'REMAND',
      numberOfDays: 98765,
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
    {
      type: 'RESTORED_ADDITIONAL_DAYS_AWARDED',
      numberOfDays: 987654,
      fromDate: '2021-03-07',
      toDate: '2021-03-08',
      active: false,
    },
  ],
} as AnalyzedPrisonApiBookingAndSentenceAdjustments
const stubbedReturnToCustodyDate = {
  returnToCustodyDate: '2022-04-12',
} as PrisonApiReturnToCustodyDate
const stubbedGenuineOverrideRequest = {
  reason: 'Other: reason',
  savedCalculation: '123',
  originalCalculationRequest: '456',
  isOverridden: true,
} as GenuineOverrideRequest
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
  releaseDatesWithAdjustments: [],
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
        offence: { offenceEndDate: '2021-02-03' },
        isSDSPlus: false,
      } as AnalysedSentenceAndOffence,
      {
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
      } as AnalysedSentenceAndOffence,
    ],
  },
  approvedDates: {},
}

beforeEach(() => {
  config.apis.calculateReleaseDates.url = 'http://localhost:8100'
  config.featureToggles.sdsExclusionIndicatorsEnabled = false
  fakeApi = nock(config.apis.calculateReleaseDates.url)
  sessionSetup = new SessionSetup()
  app = appWithAllRoutes({
    services: {
      userPermissionsService,
      calculateReleaseDatesService,
      prisonerService,
      viewReleaseDatesService,
      checkInformationService,
      userInputService,
      manualEntryService,
    },
    sessionSetup,
  })
})

afterEach(() => {
  nock.cleanAll()
  jest.resetAllMocks()
})

describe('Genuine overrides routes tests', () => {
  it('GET /specialist-support should return the Specialist Support index page', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    return request(app)
      .get('/specialist-support')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Specialist support team override tool')
      })
  })
  it('GET /specialist-support should return the not found page if does not have role', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(false)
    return request(app)
      .get('/specialist-support')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Not found')
      })
  })
  it('GET /specialist-support should return the Specialist Support index page with prisoner identity bar', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    calculateReleaseDatesService.getCalculationResultsByReference.mockResolvedValue(stubbedCalculationResults)
    prisonerService.getPrisonerDetailForSpecialistSupport.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .get('/specialist-support?calculationReference=123')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Specialist support team override tool')
        expect(res.text).toContain('Anon')
        expect(res.text).toContain('Nobody')
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })
  it('GET /specialist-support/search should return the Specialist Support search page', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    return request(app)
      .get('/specialist-support/search')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Specialist support team override tool')
        expect(res.text).toContain('Look up a calculation')
        expect(res.text).toContain('Enter the calculation reference number')
        expectNoMiniProfile(res.text)
      })
  })
  it('GET /specialist-support/search should not return the Specialist Support search page if you do not have permission', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(false)
    return request(app)
      .get('/specialist-support/search')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Not found')
      })
  })
  it('GET /specialist-support/search should not return the Specialist Support search page if you do not have permission', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(false)
    return request(app)
      .get('/specialist-support/search')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Not found')
      })
  })
  it('POST /specialist-support/search with no calc ref will show error', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    return request(app)
      .post('/specialist-support/search')
      .type('form')
      .send({})
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('You must enter a calculation reference number before continuing.')
      })
  })
  it('POST /specialist-support/search with calc ref that cannot be found will show error', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    calculateReleaseDatesService.getCalculationResultsByReference.mockResolvedValue(null)
    return request(app)
      .post('/specialist-support/search')
      .type('form')
      .send({ calculationReference: '123' })
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          'The calculation reference number you entered could not be found. Check the reference and try again.',
        )
      })
  })
  it('POST /specialist-support/search with calc ref that cannot be found will show error', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    calculateReleaseDatesService.getCalculationResultsByReference.mockResolvedValue(stubbedCalculationResults)
    return request(app)
      .post('/specialist-support/search')
      .type('form')
      .send({ calculationReference: '123' })
      .expect(302)
      .expect('Location', '/specialist-support/calculation/123')
      .expect(res => {
        expect(res.redirect).toBeTruthy()
      })
  })
  it('GET /specialist-support/calculation/:calculationReference should not return the Specialist Support confirm page if you do not have permission', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(false)
    return request(app)
      .get('/specialist-support/calculation/123')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Not found')
      })
  })
  it('GET /specialist-support/calculation/:calculationReference should return the Specialist Support confirm page with prisoner identity bar', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    calculateReleaseDatesService.getCalculationResultsByReference.mockResolvedValue(stubbedCalculationResults)
    prisonerService.getPrisonerDetailForSpecialistSupport.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .get('/specialist-support/calculation/123')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Specialist support team override tool')
        expect(res.text).toContain('Anon Nobody')
        expect(res.text).toContain('123')
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })
  it('GET /specialist-support/calculation/:calculationReference should return error if no prisoner found', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    calculateReleaseDatesService.getCalculationResultsByReference.mockResolvedValue(stubbedCalculationResults)
    prisonerService.getPrisonerDetailForSpecialistSupport.mockResolvedValue(null)
    return request(app)
      .get('/specialist-support/calculation/123')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('A calculation or prisoner could not be found')
      })
  })
  it('GET /specialist-support/calculation/:calculationReference should return error if no calculation found', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    calculateReleaseDatesService.getCalculationResultsByReference.mockResolvedValue(null)
    prisonerService.getPrisonerDetailForSpecialistSupport.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .get('/specialist-support/calculation/123')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('A calculation or prisoner could not be found')
      })
  })
  it('GET /specialist-support/calculation/:calculationReference/reason should show the options', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    calculateReleaseDatesService.getCalculationResultsByReference.mockResolvedValue(stubbedCalculationResults)
    prisonerService.getPrisonerDetailForSpecialistSupport.mockResolvedValue(stubbedPrisonerData)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .get('/specialist-support/calculation/123/reason')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Other')
        expect(res.text).toContain('Select the reason for the override')
        expect(res.text).toContain('Order of imprisonment/warrant doesn’t match trial record sheet')
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })
  it('POST /specialist-support/calculation/:calculationReference/reason without selection  will show error', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    calculateReleaseDatesService.getCalculationResultsByReference.mockResolvedValue(stubbedCalculationResults)
    prisonerService.getPrisonerDetailForSpecialistSupport.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .post('/specialist-support/calculation/123/reason')
      .type('form')
      .send({ overrideReason: null })
      .expect(302)
      .expect('Location', '/specialist-support/calculation/123/reason?noRadio=true')
  })
  it('POST /specialist-support/calculation/:calculationReference/reason without other reason  will show error', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    calculateReleaseDatesService.getCalculationResultsByReference.mockResolvedValue(stubbedCalculationResults)
    prisonerService.getPrisonerDetailForSpecialistSupport.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .post('/specialist-support/calculation/123/reason')
      .type('form')
      .send({ overrideReason: 'other', otherReason: '' })
      .expect(302)
      .expect('Location', '/specialist-support/calculation/123/reason?noOtherReason=true')
  })
  it('POST /specialist-support/calculation/:calculationReference/reason with reason will redirect', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    calculateReleaseDatesService.getCalculationResultsByReference.mockResolvedValue(stubbedCalculationResults)
    prisonerService.getPrisonerDetailForSpecialistSupport.mockResolvedValue(stubbedPrisonerData)
    fakeApi.post(`/specialist-support/genuine-override`).reply(200, {} as GenuineOverrideRequest)
    return request(app)
      .post('/specialist-support/calculation/123/reason')
      .type('form')
      .send({ overrideReason: 'terror', otherReason: '' })
      .expect(302)
      .expect('Location', '/specialist-support/calculation/123/select-date-types')
  })

  it('GET /specialist-support/calculation/:calculationReference/summary/:calculationRequestId should return the calculation summary with mini profile', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue(
      stubbedResultsWithBreakdownAndAdjustments,
    )

    return request(app)
      .get(
        `/specialist-support/calculation/${stubbedCalculationResults.calculationReference}/summary/${stubbedCalculationResults.calculationRequestId}`,
      )
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })

  it('GET /specialist-support/calculation/:calculationReference/sentence-and-offence-information shows check information page with mini profile and correct offence title', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    const model = new SentenceAndOffenceViewModel(
      stubbedPrisonerData,
      stubbedUserInput,
      stubbedSentencesAndOffences,
      stubbedAdjustments,
      false,
      stubbedReturnToCustodyDate,
      null,
    )
    checkInformationService.checkInformation.mockResolvedValue(model)
    return request(app)
      .get('/specialist-support/calculation/123/sentence-and-offence-information')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-qa=123-title]').text()).toStrictEqual('123 - Doing a crime')
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })
  it('GET /specialist-support/calculation/:calculationReference/sentence-and-offence-information shows SDS+ badge and banner if SDS+ sentence', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    const model = new SentenceAndOffenceViewModel(
      stubbedPrisonerData,
      stubbedUserInput,
      stubbedSentencesAndOffences,
      stubbedAdjustments,
      false,
      stubbedReturnToCustodyDate,
      null,
    )
    checkInformationService.checkInformation.mockResolvedValue(model)
    return request(app)
      .get('/specialist-support/calculation/123/sentence-and-offence-information')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('.moj-badge.moj-badge--small:contains("SDS+")')).toHaveLength(1)
        expect($('[data-qa=sds-plus-notification-banner]')).toHaveLength(1)
      })
  })
  it('GET /specialist-support/calculation/:calculationReference/sentence-and-offence-information shows exclusions if feature toggle is on', () => {
    config.featureToggles.sdsExclusionIndicatorsEnabled = true
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    const model = new SentenceAndOffenceViewModel(
      stubbedPrisonerData,
      stubbedUserInput,
      sentencesAndOffencesWithExclusions,
      stubbedAdjustments,
      false,
      stubbedReturnToCustodyDate,
      null,
    )
    checkInformationService.checkInformation.mockResolvedValue(model)
    return request(app)
      .get('/specialist-support/calculation/123/sentence-and-offence-information')
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
  it('GET /specialist-support/calculation/:calculationReference/sentence-and-offence-information does not show exclusions if feature toggle is off', () => {
    config.featureToggles.sdsExclusionIndicatorsEnabled = false
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    const model = new SentenceAndOffenceViewModel(
      stubbedPrisonerData,
      stubbedUserInput,
      sentencesAndOffencesWithExclusions,
      stubbedAdjustments,
      false,
      stubbedReturnToCustodyDate,
      null,
    )
    checkInformationService.checkInformation.mockResolvedValue(model)
    return request(app)
      .get('/specialist-support/calculation/123/sentence-and-offence-information')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('.sentence-card:contains("SXOFFENCE")').text()).not.toContain('Sexual')
        expect($('.sentence-card:contains("VIOOFFENCE")').text()).not.toContain('Violent')
        const noExclusionCard = $('.sentence-card:contains("No exclusion offence")')
        expect(noExclusionCard.text()).not.toContain('Sexual')
        expect(noExclusionCard.text()).not.toContain('Violent')
      })
  })
  it('GET /specialist-support/calculation/:calculationReference/sentence-and-offence-information shows no SDS+ badge or banner if not SDS+ sentence', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    const model = new SentenceAndOffenceViewModel(
      stubbedPrisonerData,
      stubbedUserInput,
      [
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
          offence: { offenceEndDate: '2021-02-03' },
          isSDSPlus: false,
        } as AnalysedSentenceAndOffence,
      ],
      stubbedAdjustments,
      false,
      stubbedReturnToCustodyDate,
      null,
    )
    checkInformationService.checkInformation.mockResolvedValue(model)
    return request(app)
      .get('/specialist-support/calculation/123/sentence-and-offence-information')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        // 5 offences in the only SDS+ sentence
        expect($('.moj-badge.moj-badge--small:contains("SDS+")')).toHaveLength(0)
        expect($('[data-qa=sds-plus-notification-banner]')).toHaveLength(0)
      })
  })
  it('POST /specialist-support/calculation/:calculationReference/sentence-and-offence-information should validate and redirect to calc summary when no original calc reason', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    calculateReleaseDatesService.getCalculationResultsByReference.mockResolvedValue(stubbedCalculationResults)
    userInputService.getCalculationUserInputForPrisoner.mockReturnValue(stubbedUserInput)
    calculateReleaseDatesService.validateBackend.mockReturnValue({ messages: [] } as never)
    calculateReleaseDatesService.calculatePreliminaryReleaseDates.mockResolvedValue(stubbedNewCalculationResults)

    return request(app)
      .post('/specialist-support/calculation/123/sentence-and-offence-information')
      .expect(302)
      .expect('Location', '/specialist-support/calculation/XYZ789/summary/987654')
  })
  it('POST /specialist-support/calculation/:calculationReference/sentence-and-offence-information should validate and redirect to calc summary using calc reason from original calc', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    calculateReleaseDatesService.getCalculationResultsByReference.mockResolvedValue(stubbedCalculationResultsWithReason)
    userInputService.getCalculationUserInputForPrisoner.mockReturnValue(stubbedUserInput)
    calculateReleaseDatesService.validateBackend.mockReturnValue({ messages: [] } as never)
    calculateReleaseDatesService.calculatePreliminaryReleaseDates.mockResolvedValue(stubbedNewCalculationResults)

    return request(app)
      .post('/specialist-support/calculation/123/sentence-and-offence-information')
      .expect(302)
      .expect('Location', '/specialist-support/calculation/XYZ789/summary/987654')
  })
  it('GET /specialist-support/calculation/:calculationReference/complete shows check confirmation page with mini profile', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    calculateReleaseDatesService.getCalculationResultsByReference.mockResolvedValue(stubbedCalculationResults)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getGenuineOverride.mockResolvedValue(stubbedGenuineOverrideRequest)
    return request(app)
      .get('/specialist-support/calculation/ABC/complete')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })

  it('GET /specialist-support/calculation/:calculationReference/confirm-override shows check confirm override page with mini profile', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    calculateReleaseDatesService.getCalculationResultsByReference.mockResolvedValue(stubbedCalculationResults)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    manualEntryService.getConfirmationConfiguration.mockResolvedValue([])
    return request(app)
      .get('/specialist-support/calculation/ABC/confirm-override')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })

  it('GET /specialist-support/calculation/:calculationReference/enter-date shows enter date page with mini profile', () => {
    sessionSetup.sessionDoctor = req => {
      req.session.selectedManualEntryDates = {}
      req.session.selectedManualEntryDates[stubbedCalculationResults.prisonerId] = [
        {
          dateType: 'CRD',
          dateText: 'CRD (Conditional release date)',
          date: { day: 3, month: 3, year: 2017 },
        } as ManualEntrySelectedDate,
      ]
    }
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    calculateReleaseDatesService.getCalculationResultsByReference.mockResolvedValue(stubbedCalculationResults)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    manualEntryService.getNextDateToEnter.mockReturnValue({
      dateType: 'CRD',
      dateText: 'CRD (Conditional release date)',
      date: { day: 3, month: 3, year: 2017 },
    } as ManualEntrySelectedDate)
    return request(app)
      .get('/specialist-support/calculation/ABC/enter-date')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })

  it('POST /specialist-support/calculation/:calculationReference/enter-date shows enter date page if submit errors with mini profile', () => {
    sessionSetup.sessionDoctor = req => {
      req.session.selectedManualEntryDates = {}
      req.session.selectedManualEntryDates[stubbedCalculationResults.prisonerId] = [
        {
          dateType: 'CRD',
          dateText: 'CRD (Conditional release date)',
          date: { day: 3, month: 3, year: 2017 },
        } as ManualEntrySelectedDate,
      ]
    }
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    calculateReleaseDatesService.getCalculationResultsByReference.mockResolvedValue(stubbedCalculationResults)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    manualEntryService.storeDate.mockReturnValue({
      success: false,
      isNone: false,
      message: 'Foo',
    } as StorageResponseModel)
    manualEntryService.getNextDateToEnter.mockReturnValue({
      dateType: 'CRD',
      dateText: 'CRD (Conditional release date)',
      date: { day: 3, month: 3, year: 2017 },
    } as ManualEntrySelectedDate)
    return request(app)
      .post('/specialist-support/calculation/ABC/enter-date')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })

  it('GET /specialist-support/calculation/:calculationReference/select-date-types loads the select date types page with a mini profile', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    calculateReleaseDatesService.getCalculationResultsByReference.mockResolvedValue(stubbedCalculationResults)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    manualEntryService.verifySelectedDateType.mockResolvedValue({
      error: false,
      config: undefined,
    })
    return request(app)
      .get('/specialist-support/calculation/ABC/select-date-types')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })
  it('POST /specialist-support/calculation/:calculationReference/select-date-types loads the select date types page if there was an error validating', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    calculateReleaseDatesService.getCalculationResultsByReference.mockResolvedValue(stubbedCalculationResults)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    manualEntryService.verifySelectedDateType.mockResolvedValue({
      error: true,
      config: undefined,
    })
    return request(app)
      .post('/specialist-support/calculation/ABC/select-date-types')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })

  it('GET /specialist-support/calculation/:calculationReference/remove-date loads the remote dates page with a mini profile', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    calculateReleaseDatesService.getCalculationResultsByReference.mockResolvedValue(stubbedCalculationResults)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    sessionSetup.sessionDoctor = req => {
      req.session.selectedManualEntryDates = {}
      req.session.selectedManualEntryDates[stubbedCalculationResults.prisonerId] = [
        {
          dateType: 'CRD',
          dateText: 'CRD (Conditional release date)',
          date: { day: 3, month: 3, year: 2017 },
        } as ManualEntrySelectedDate,
      ]
    }
    return request(app)
      .get('/specialist-support/calculation/ABC/remove-date?dateType=CRD')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })

  it('POST /specialist-support/calculation/:calculationReference/remove-date loads the remote dates page with a mini profile on validation error', () => {
    userPermissionsService.allowSpecialSupport.mockReturnValue(true)
    calculateReleaseDatesService.getCalculationResultsByReference.mockResolvedValue(stubbedCalculationResults)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    sessionSetup.sessionDoctor = req => {
      req.session.selectedManualEntryDates = {}
      req.session.selectedManualEntryDates[stubbedCalculationResults.prisonerId] = [
        {
          dateType: 'CRD',
          dateText: 'CRD (Conditional release date)',
          date: { day: 3, month: 3, year: 2017 },
        } as ManualEntrySelectedDate,
      ]
    }
    return request(app)
      .post('/specialist-support/calculation/ABC/remove-date?dateType=CRD')
      .send({ 'remove-date': '' })
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })

  it('GET /calculation/:calculationReference/request-support loads the request support page with mini profile', () => {
    calculateReleaseDatesService.getCalculationResultsByReference.mockResolvedValue(stubbedCalculationResults)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)

    return request(app)
      .get('/calculation/ABC/request-support')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })
})

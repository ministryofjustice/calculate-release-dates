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
  PrisonApiReturnToCustodyDate,
  PrisonApiSentenceDetail,
} from '../@types/prisonApi/prisonClientTypes'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import { FullPageError } from '../types/FullPageError'
import { ErrorMessageType } from '../types/ErrorMessages'
import UserInputService from '../services/userInputService'
import {
  AnalysedSentenceAndOffence,
  CalculationSentenceUserInput,
  CalculationUserInputs,
  ValidationMessage,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import CheckInformationService from '../services/checkInformationService'
import SentenceAndOffenceViewModel from '../models/SentenceAndOffenceViewModel'
import { expectMiniProfile } from './testutils/layoutExpectations'
import config from '../config'
import SessionSetup from './testutils/sessionSetup'
import AuditService from '../services/auditService'

jest.mock('../services/userService')
jest.mock('../services/calculateReleaseDatesService')
jest.mock('../services/prisonerService')
jest.mock('../services/userInputService')
jest.mock('../services/checkInformationService')

const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const userService = new UserService(null, prisonerService) as jest.Mocked<UserService>
const auditService = new AuditService() as jest.Mocked<AuditService>
const calculateReleaseDatesService = new CalculateReleaseDatesService(
  auditService,
) as jest.Mocked<CalculateReleaseDatesService>
const userInputService = new UserInputService() as jest.Mocked<UserInputService>
const checkInformationService = new CheckInformationService(
  calculateReleaseDatesService,
  prisonerService,
  userInputService,
) as jest.Mocked<CheckInformationService>

let app: Express
let sessionSetup: SessionSetup

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
    sentenceTypeDescription: 'SDS Standard Sentence',
    caseSequence: 1,
    lineSequence: 1,
    caseReference: 'CASE001',
    courtDescription: 'Court 1',
    sentenceSequence: 1,
    offence: { offenceEndDate: '2021-02-03' },
    sentenceAndOffenceAnalysis: 'NEW',
    isSDSPlus: true,
    hasAnSDSEarlyReleaseExclusion: 'NO',
  } as AnalysedSentenceAndOffence,
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
    offence: { offenceStartDate: '2021-01-04', offenceEndDate: '2021-01-05' },
    sentenceAndOffenceAnalysis: 'NEW',
    isSDSPlus: true,
    hasAnSDSEarlyReleaseExclusion: 'NO',
  } as AnalysedSentenceAndOffence,
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
    offence: { offenceStartDate: '2021-03-06' },
    sentenceAndOffenceAnalysis: 'NEW',
    isSDSPlus: true,
    hasAnSDSEarlyReleaseExclusion: 'NO',
  } as AnalysedSentenceAndOffence,
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
    offence: {
      offenceDescription: 'Rape of a minor',
      offenceStartDate: '2021-01-07',
      offenceEndDate: '2021-01-07',
    },
    sentenceAndOffenceAnalysis: 'NEW',
    isSDSPlus: true,
    hasAnSDSEarlyReleaseExclusion: 'NO',
  } as AnalysedSentenceAndOffence,
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
    offence: {},
    sentenceAndOffenceAnalysis: 'NEW',
    isSDSPlus: true,
    hasAnSDSEarlyReleaseExclusion: 'NO',
  } as AnalysedSentenceAndOffence,
  {
    terms: [
      {
        years: 2,
      },
    ],
    caseSequence: 2,
    lineSequence: 2,
    caseReference: 'CASE002',
    courtDescription: 'Court 2',
    sentenceSequence: 2,
    consecutiveToSequence: 1,
    sentenceTypeDescription: 'SDS Standard Sentence',
    offence: { offenceEndDate: '2021-02-03' },
    sentenceAndOffenceAnalysis: 'NEW',
    isSDSPlus: false,
    hasAnSDSEarlyReleaseExclusion: 'NO',
  } as AnalysedSentenceAndOffence,
  {
    sentenceSequence: 3,
    lineSequence: 3,
    caseSequence: 3,
    courtDescription: 'Preston Crown Court',
    sentenceStatus: 'A',
    sentenceCategory: '2020',
    sentenceCalculationType: '14FTR_ORA',
    sentenceTypeDescription: 'ORA 14 Day Fixed Term Recall',
    sentenceDate: '2021-09-03',
    terms: [
      {
        years: 0,
        months: 2,
        weeks: 0,
        days: 0,
      },
    ],
    offence: {
      offenderChargeId: 1,
      offenceStartDate: '2020-01-01',
      offenceCode: 'RL05016',
      offenceDescription: 'Access / exit by unofficial route - railway bye-law',
    },
    sentenceAndOffenceAnalysis: 'NEW',
    isSDSPlus: false,
    hasAnSDSEarlyReleaseExclusion: 'NO',
    revocationDates: ['2022-02-14', '2022-04-02'],
  } as AnalysedSentenceAndOffence,
  {
    sentenceSequence: 3,
    lineSequence: 3,
    caseSequence: 3,
    courtDescription: 'Preston Crown Court',
    sentenceStatus: 'A',
    sentenceCategory: '2020',
    sentenceCalculationType: '14FTR_ORA',
    sentenceTypeDescription: 'ORA 14 Day Fixed Term Recall',
    sentenceDate: '2021-09-03',
    terms: [
      {
        years: 0,
        months: 2,
        weeks: 0,
        days: 0,
      },
    ],
    offence: {
      offenderChargeId: 2,
      offenceStartDate: '2020-01-01',
      offenceCode: 'RL05017',
      offenceDescription: 'Access / exit by unofficial route - railway bye-law',
    },
    sentenceAndOffenceAnalysis: 'NEW',
    isSDSPlus: false,
    hasAnSDSEarlyReleaseExclusion: 'NO',
    revocationDates: ['2022-02-14', '2022-04-02'],
  } as AnalysedSentenceAndOffence,
  {
    sentenceSequence: 4,
    lineSequence: 4,
    caseSequence: 4,
    courtDescription: 'Amersham Crown Court',
    sentenceStatus: 'A',
    sentenceCategory: '2020',
    sentenceCalculationType: 'EDSU18',
    sentenceTypeDescription: 'EDS Sec 254 Sentencing Code (U18)',
    sentenceDate: '2022-08-08',
    terms: [
      {
        years: 6,
        months: 0,
        weeks: 0,
        days: 0,
        code: 'IMP',
      },
      {
        years: 9,
        months: 0,
        weeks: 0,
        days: 0,
        code: 'IMP',
      },
      {
        years: 2,
        months: 0,
        weeks: 0,
        days: 0,
        code: 'LIC',
      },
      {
        years: 3,
        months: 0,
        weeks: 0,
        days: 0,
        code: 'LIC',
      },
    ],
    offence: {
      offenderChargeId: 3933291,
      offenceStartDate: '2022-08-07',
      offenceCode: 'TH68013A',
      offenceDescription: 'Attempt theft of motor vehicle',
      indicators: ['D', '50', '51'],
    },
    sentenceAndOffenceAnalysis: 'NEW',
    isSDSPlus: false,
    hasAnSDSEarlyReleaseExclusion: 'NO',
  } as AnalysedSentenceAndOffence,
  {
    bookingId: 1203025,
    sentenceSequence: 4,
    lineSequence: 4,
    caseSequence: 4,
    courtDescription: 'Abergavenny Magistrates Court',
    sentenceStatus: 'A',
    sentenceCategory: '2020',
    sentenceCalculationType: 'A/FINE',
    sentenceTypeDescription: 'Imprisonment in Default of Fine',
    sentenceDate: '2022-10-01',
    terms: [{ years: 0, months: 0, weeks: 0, days: 90, code: 'IMP' }],
    offence: {
      offenderChargeId: 3933385,
      offenceStartDate: '2022-01-01',
      offenceCode: 'WC81161',
      offenceDescription: 'Keep / confine bird in small cage / receptacle',
      indicators: ['99'],
    },
    fineAmount: 3000,
    sentenceAndOffenceAnalysis: 'NEW',
    isSDSPlus: false,
    hasAnSDSEarlyReleaseExclusion: 'NO',
  } as AnalysedSentenceAndOffence,
  {
    bookingId: 1203780,
    sentenceSequence: 5,
    lineSequence: 5,
    caseSequence: 5,
    courtDescription: 'Aldershot and Farnham County Court',
    sentenceStatus: 'A',
    sentenceCategory: '2003',
    sentenceCalculationType: 'LR_LASPO_DR',
    sentenceTypeDescription: 'LR - EDS LASPO Discretionary Release',
    sentenceDate: '2018-06-15',
    terms: [
      { years: 0, months: 40, weeks: 0, days: 0, code: 'IMP' },
      { years: 0, months: 32, weeks: 0, days: 0, code: 'LIC' },
    ],
    offence: {
      offenderChargeId: 3933639,
      offenceStartDate: '2018-04-01',
      offenceCode: 'FA06003B',
      offenceDescription: 'Aid and abet fraud by abuse of position',
      indicators: [],
    },
    sentenceAndOffenceAnalysis: 'SAME',
    isSDSPlus: false,
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
} as AnalysedPrisonApiBookingAndSentenceAdjustments

const stubbedReturnToCustodyDate = {
  returnToCustodyDate: '2022-04-12',
} as PrisonApiReturnToCustodyDate

beforeEach(() => {
  config.featureToggles.sdsExclusionIndicatorsEnabled = false
  sessionSetup = new SessionSetup()
  app = appWithAllRoutes({
    services: {
      userService,
      prisonerService,
      calculateReleaseDatesService,
      userInputService,
      checkInformationService,
    },
    sessionSetup,
  })
})

afterEach(() => {
  jest.resetAllMocks()
  jest.resetModules()
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
      { method: 'GET', url: '/calculation/A1234AA/check-information-unsupported' },
      { method: 'POST', url: '/calculation/A1234AA/check-information-unsupported' },
    ]

    await runTest(routes)
  })
})

describe('Check information routes tests', () => {
  it(
    'Unsupported type with NOMIS offence dates missing redirected to with error,' +
      ' once resolved proceed to manual entry on submission',
    async () => {
      calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue([
        {
          type: 'UNSUPPORTED_SENTENCE',
        } as ValidationMessage,
      ])
      calculateReleaseDatesService.validateBookingForManualEntry.mockReturnValue({
        messages: [{ text: 'Court case 1 count 1 must include an offence date' }],
        messageType: ErrorMessageType.VALIDATION,
      } as never)

      const model = new SentenceAndOffenceViewModel(
        stubbedPrisonerData,
        stubbedUserInput,
        stubbedSentencesAndOffences,
        stubbedAdjustments,
        false,
        true,
        stubbedReturnToCustodyDate,
        {
          messages: [{ text: 'Court case 1 count 1 must include an offence date' }],
          messageType: ErrorMessageType.VALIDATION,
        },
        [],
      )
      checkInformationService.checkInformation.mockResolvedValue(model)

      let requestRedirectLocation: string

      // 1. Initial submission to calculate release dates returns redirect to error page
      await request(app)
        .post('/calculation/A1234AA/check-information-unsupported')
        .expect(302)
        .expect('Location', '/calculation/A1234AA/check-information-unsupported?hasErrors=true')
        .expect(res => {
          expect(res.redirect).toBeTruthy()
          requestRedirectLocation = res.headers.location
        })

      // 2. Follow redirect to check page with errors
      await request(app)
        .get(requestRedirectLocation)
        .expect(200)
        .expect(res => {
          expect(res.text).toContain('Court case 1 count 1 must include an offence date')
          const $ = cheerio.load(res.text)
          expect($('.moj-badge.moj-badge--small:contains("SDS+")')).toHaveLength(5)
          expect($('.new-sentence-card:contains("Rape of a minor")').text()).toContain('SDS+')
          expect($('[data-qa=sds-plus-notification-banner]')).toHaveLength(1)
        })

      const modelClearedErrors = new SentenceAndOffenceViewModel(
        stubbedPrisonerData,
        stubbedUserInput,
        stubbedSentencesAndOffences,
        stubbedAdjustments,
        false,
        true,
        stubbedReturnToCustodyDate,
        { messages: [] } as never,
        [],
      )

      checkInformationService.checkInformation.mockResolvedValue(modelClearedErrors)
      calculateReleaseDatesService.validateBookingForManualEntry.mockReturnValue({ messages: [] } as never)

      // 3. Now that no validation errors are returned check redirect to manual entry page
      await request(app)
        .post('/calculation/A1234AA/check-information-unsupported')
        .expect(302)
        .expect('Location', '/calculation/A1234AA/manual-entry')
        .expect(res => {
          expect(res.redirect).toBeTruthy()
        })
    },
  )
  it('Unsupported without SDS+ shows no SDS+ banner', async () => {
    const sentenceAndOffencesWithNoSDSPlus = [
      {
        bookingId: 1203780,
        sentenceSequence: 5,
        lineSequence: 5,
        caseSequence: 5,
        courtDescription: 'Aldershot and Farnham County Court',
        sentenceStatus: 'A',
        sentenceCategory: '2003',
        sentenceCalculationType: 'LR_LASPO_DR',
        sentenceTypeDescription: 'LR - EDS LASPO Discretionary Release',
        sentenceDate: '2018-06-15',
        terms: [
          { years: 0, months: 40, weeks: 0, days: 0, code: 'IMP' },
          { years: 0, months: 32, weeks: 0, days: 0, code: 'LIC' },
        ],
        offence: {
          offenderChargeId: 3933639,
          offenceStartDate: '2018-04-01',
          offenceCode: 'FA06003B',
          offenceDescription: 'Aid and abet fraud by abuse of position',
          indicators: [],
        },
        sentenceAndOffenceAnalysis: 'SAME',
        isSDSPlus: false,
        hasAnSDSEarlyReleaseExclusion: 'NO',
      } as AnalysedSentenceAndOffence,
    ]

    const model = new SentenceAndOffenceViewModel(
      stubbedPrisonerData,
      stubbedUserInput,
      sentenceAndOffencesWithNoSDSPlus,
      stubbedAdjustments,
      false,
      true,
      stubbedReturnToCustodyDate,
      {
        messages: [{ text: 'Court case 1 count 1 must include an offence date' }],
        messageType: ErrorMessageType.VALIDATION,
      } as never,
      [],
    )
    checkInformationService.checkInformation.mockResolvedValue(model)

    await request(app)
      .get('/calculation/A1234AA/check-information-unsupported?hasErrors=true')
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Court case 1 count 1 must include an offence date')
        const $ = cheerio.load(res.text)
        expect($('[data-qa=sds-plus-notification-banner]')).toHaveLength(0)
      })
  })

  it('GET /calculation/:nomsId/check-information-unsupported loads page and displays a mini profile and correct offence title', () => {
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue([
      {
        type: 'UNSUPPORTED_SENTENCE',
      } as ValidationMessage,
    ])
    const model = new SentenceAndOffenceViewModel(
      stubbedPrisonerData,
      stubbedUserInput,
      stubbedSentencesAndOffences,
      stubbedAdjustments,
      false,
      true,
      stubbedReturnToCustodyDate,
      null,
      [],
    )
    checkInformationService.checkInformation.mockResolvedValue(model)
    return request(app)
      .get('/calculation/A1234AA/check-information-unsupported')
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-qa=cancel-link]').first().attr('href')).toStrictEqual(
          '/calculation/A1234AA/cancelCalculation?redirectUrl=/calculation/A1234AA/check-information-unsupported',
        )
        expect($('[data-qa=RL05016-title]').text()).toStrictEqual(
          'RL05016 - Access / exit by unofficial route - railway bye-law',
        )
        expectMiniProfile(res.text, expectedMiniProfile)
        expect(res.text).toContain('/calculation/A1234AA/reason')
        expect($('[data-qa=ciu-title]').text()).toStrictEqual('Check sentence and offence information')
      })
  })
})

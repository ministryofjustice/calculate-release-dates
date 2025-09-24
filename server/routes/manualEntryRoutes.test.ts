import request from 'supertest'
import type { Express } from 'express'
import nock from 'nock'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import PrisonerService from '../services/prisonerService'
import {
  PrisonAPIAssignedLivingUnit,
  PrisonApiPrisoner,
  PrisonApiSentenceDetail,
} from '../@types/prisonApi/prisonClientTypes'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import {
  ManualEntrySelectedDate,
  ValidationMessage,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ManualCalculationService from '../services/manualCalculationService'
import ManualEntryService from '../services/manualEntryService'
import DateTypeConfigurationService from '../services/dateTypeConfigurationService'
import DateValidationService, { StorageResponseModel } from '../services/dateValidationService'
import { expectMiniProfile } from './testutils/layoutExpectations'
import SessionSetup from './testutils/sessionSetup'
import config from '../config'
import { testDateTypeDefinitions } from '../testutils/createUserToken'
import { FullPageError } from '../types/FullPageError'
import { ErrorMessageType } from '../types/ErrorMessages'
import AuditService from '../services/auditService'
import { ManualJourneySelectedDate } from '../types/ManualJourney'

jest.mock('../services/prisonerService')
jest.mock('../services/calculateReleaseDatesService')
jest.mock('../services/manualCalculationService')
jest.mock('../services/auditService')

const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const auditService = new AuditService() as jest.Mocked<AuditService>
const calculateReleaseDatesService = new CalculateReleaseDatesService(
  auditService,
) as jest.Mocked<CalculateReleaseDatesService>
const manualCalculationService = new ManualCalculationService(auditService) as jest.Mocked<ManualCalculationService>
const dateTypeConfigurationService = new DateTypeConfigurationService()
const dateValidationService = new DateValidationService()
const manualEntryService = new ManualEntryService(
  dateTypeConfigurationService,
  dateValidationService,
  calculateReleaseDatesService,
)
let app: Express
let sessionSetup: SessionSetup
const stubbedEmptyMessages: ValidationMessage[] = []

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
let fakeApi: nock.Scope
beforeEach(() => {
  sessionSetup = new SessionSetup()
  sessionSetup.sessionDoctor = req => {
    req.session.manualEntryRoutingForBookings = []
    req.session.calculationReasonId = 1
  }
  config.apis.calculateReleaseDates.url = 'http://localhost:8100'
  fakeApi = nock(config.apis.calculateReleaseDates.url)
  fakeApi.get('/reference-data/date-type', '').reply(200, testDateTypeDefinitions).persist()
  calculateReleaseDatesService.validateDatesForManualEntry.mockResolvedValue({
    messages: [],
    messageType: null,
  })
  app = appWithAllRoutes({
    services: {
      calculateReleaseDatesService,
      prisonerService,
      manualCalculationService,
      manualEntryService,
    },
    sessionSetup,
  })
})

afterEach(() => {
  jest.resetAllMocks()
  nock.cleanAll()
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
      { method: 'GET', url: '/calculation/A1234AA/manual-entry' },
      { method: 'GET', url: '/calculation/A1234AA/manual-entry/select-dates' },
      { method: 'GET', url: '/calculation/A1234AA/manual-entry/confirmation' },
      { method: 'POST', url: '/calculation/A1234AA/manual-entry/remove-date?dateType=CRD' },
      { method: 'POST', url: '/calculation/A1234AA/manual-entry/no-dates-confirmation' },
    ]

    await runTest(routes)
  })
})

describe('Tests for /calculation/:nomsId/manual-entry', () => {
  it('GET if there are no unsupported sentences the page re-directs', () => {
    manualCalculationService.hasRecallSentences.mockResolvedValue(false)
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue(stubbedEmptyMessages)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)

    return request(app)
      .get('/calculation/A1234AA/manual-entry')
      .expect(302)
      .expect(res => {
        expect(res.redirect).toBeTruthy()
      })
  })

  it('GET if there is a recall the page display correctly', () => {
    manualCalculationService.hasRecallSentences.mockResolvedValue(true)
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue([])
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessagesWithType.mockResolvedValue({
      unsupportedSentenceMessages: [],
      unsupportedCalculationMessages: [],
      unsupportedManualMessages: [],
    })
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    manualCalculationService.hasIndeterminateSentences.mockResolvedValue(false)

    return request(app)
      .get('/calculation/A1234AA/manual-entry')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Enter the dates manually')
        expectMiniProfile(res.text, expectedMiniProfile)
        const $ = cheerio.load(res.text)
        expect($('[data-qa=cancel-link]').first().attr('href')).toStrictEqual(
          '/calculation/A1234AA/cancelCalculation?redirectUrl=/calculation/A1234AA/manual-entry',
        )
      })
  })

  it('GET if postCalculationValidationRedirect is set', () => {
    manualCalculationService.hasRecallSentences.mockResolvedValue(false)
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue([])
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessagesWithType.mockResolvedValue({
      unsupportedSentenceMessages: [],
      unsupportedCalculationMessages: [],
      unsupportedManualMessages: [],
    })
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    manualCalculationService.hasIndeterminateSentences.mockResolvedValue(false)

    sessionSetup.sessionDoctor = req => {
      req.session.calculationReasonId = 1
      req.session.manualEntryRoutingForBookings = ['A1234AA']
    }

    return request(app)
      .get('/calculation/A1234AA/manual-entry')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Enter the dates manually')
        expectMiniProfile(res.text, expectedMiniProfile)
        const $ = cheerio.load(res.text)
        expect($('[data-qa=cancel-link]').first().attr('href')).toStrictEqual(
          '/calculation/A1234AA/cancelCalculation?redirectUrl=/calculation/A1234AA/manual-entry',
        )
      })
  })

  it('GET if nomisId is not in the manual redirect list redirect to check information', () => {
    manualCalculationService.hasRecallSentences.mockResolvedValue(false)
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue([])
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    manualCalculationService.hasIndeterminateSentences.mockResolvedValue(false)

    sessionSetup.sessionDoctor = req => {
      req.session.manualEntryRoutingForBookings = ['A9999999']
      req.session.calculationReasonId = 1
    }

    return request(app)
      .get('/calculation/A1234AA/manual-entry')
      .expect(302)
      .expect(res => {
        expect(res.redirect).toBeTruthy()
        expect(res.headers.location).toBe('/calculation/A1234AA/check-information')
      })
  })

  it('GET if there are unsupported sentences the page display correctly', () => {
    manualCalculationService.hasRecallSentences.mockResolvedValue(false)
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue([
      {
        type: 'UNSUPPORTED_SENTENCE',
      } as ValidationMessage,
    ])
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessagesWithType.mockResolvedValue({
      unsupportedSentenceMessages: [
        {
          type: 'UNSUPPORTED_SENTENCE',
          message: 'This type of sentence is a not supported.',
        } as ValidationMessage,
      ],
      unsupportedCalculationMessages: [],
      unsupportedManualMessages: [],
    })
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    manualCalculationService.hasIndeterminateSentences.mockResolvedValue(false)

    return request(app)
      .get('/calculation/A1234AA/manual-entry')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Enter the dates manually')
        expect(res.text).toContain('The unsupported sentence type is:')
        expect(res.text).toContain('This type of sentence is a not supported')
        expectMiniProfile(res.text, expectedMiniProfile)
        const $ = cheerio.load(res.text)
        expect($('[data-qa=cancel-link]').first().attr('href')).toStrictEqual(
          '/calculation/A1234AA/cancelCalculation?redirectUrl=/calculation/A1234AA/manual-entry',
        )
      })
  })

  it('GET if there are indeterminate sentences then should have correct content on landing page', () => {
    manualCalculationService.hasRecallSentences.mockResolvedValue(false)
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue([
      {
        type: 'UNSUPPORTED_SENTENCE',
      } as ValidationMessage,
    ])
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessagesWithType.mockResolvedValue({
      unsupportedSentenceMessages: [
        {
          type: 'UNSUPPORTED_SENTENCE',
          message: 'This type of sentence is a not supported.',
        } as ValidationMessage,
      ],
      unsupportedCalculationMessages: [],
      unsupportedManualMessages: [],
    })
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    manualCalculationService.hasIndeterminateSentences.mockResolvedValue(true)
    return request(app)
      .get('/calculation/A1234AA/manual-entry')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-qa=cancel-link]').first().attr('href')).toStrictEqual(
          '/calculation/A1234AA/cancelCalculation?redirectUrl=/calculation/A1234AA/manual-entry',
        )
        const manualEntryTitle = $('[data-qa=manual-entry-title]').first()
        expect(manualEntryTitle.text().trim()).toStrictEqual('Enter the dates manually')
        expect(res.text).toContain('The unsupported sentence type is:')
        expect(res.text).toContain('This type of sentence is a not supported')
      })
  })

  it('POST where invalid date types are submitted displays errors messages', () => {
    manualCalculationService.hasRecallSentences.mockResolvedValue(false)
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue([
      {
        type: 'UNSUPPORTED_SENTENCE',
      } as ValidationMessage,
    ])
    calculateReleaseDatesService.validateDatesForManualEntry.mockResolvedValue({
      messages: [{ text: 'CRD and ARD cannot be selected together' }],
      messageType: ErrorMessageType.VALIDATION,
    })
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    manualCalculationService.hasIndeterminateSentences.mockResolvedValue(true)
    return request(app)
      .post('/calculation/A1234AA/manual-entry/select-dates')
      .send({ dateSelect: ['CRD', 'ARD'] })
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Tariff')
        expect(res.text).toContain('/calculation/A1234AA/manual-entry')
        const $ = cheerio.load(res.text)
        expect($('.govuk-error-message li').html()).toStrictEqual('CRD and ARD cannot be selected together')
      })
  })

  it('GET if there are indeterminate sentences then should have correct content', () => {
    manualCalculationService.hasRecallSentences.mockResolvedValue(false)
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue([
      {
        type: 'UNSUPPORTED_SENTENCE',
      } as ValidationMessage,
    ])
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    manualCalculationService.hasIndeterminateSentences.mockResolvedValue(true)
    return request(app)
      .get('/calculation/A1234AA/manual-entry/select-dates')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Tariff')
        expect(res.text).toContain('/calculation/A1234AA/manual-entry')
        const $ = cheerio.load(res.text)
        expect($('[data-qa=cancel-link]').first().attr('href')).toStrictEqual(
          '/calculation/A1234AA/cancelCalculation?redirectUrl=/calculation/A1234AA/manual-entry/select-dates',
        )
      })
  })

  it('GET if there are determinate sentences then should have correct data', () => {
    manualCalculationService.hasRecallSentences.mockResolvedValue(false)
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue([
      {
        type: 'UNSUPPORTED_SENTENCE',
      } as ValidationMessage,
    ])
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    manualCalculationService.hasIndeterminateSentences.mockResolvedValue(false)
    return request(app)
      .get('/calculation/A1234AA/manual-entry/select-dates')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('SED (Sentence expiry date)')
        const $ = cheerio.load(res.text)
        expect($('[data-qa=cancel-link]').first().attr('href')).toStrictEqual(
          '/calculation/A1234AA/cancelCalculation?redirectUrl=/calculation/A1234AA/manual-entry/select-dates',
        )
      })
  })

  it('POST if a date type has been selected should redirect', () => {
    manualCalculationService.hasRecallSentences.mockResolvedValue(false)
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue([
      {
        type: 'UNSUPPORTED_SENTENCE',
      } as ValidationMessage,
    ])
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)

    return request(app)
      .post('/calculation/A1234AA/manual-entry/select-dates')
      .type('form')
      .send({ dateSelect: 'SED' })
      .expect(302)
      .expect(res => {
        expect(res.text).toContain(`/calculation/${stubbedPrisonerData.offenderNo}/manual-entry/enter-date`)
      })
  })

  it('POST if a date type has not been selected should display error', () => {
    manualCalculationService.hasRecallSentences.mockResolvedValue(false)
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue([
      {
        type: 'UNSUPPORTED_SENTENCE',
      } as ValidationMessage,
    ])
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)

    return request(app)
      .post('/calculation/A1234AA/manual-entry/select-dates')
      .type('form')
      .send({ dateSelect: undefined })
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Select at least one release date.')
        const $ = cheerio.load(res.text)
        expect($('[data-qa=cancel-link]').first().attr('href')).toStrictEqual(
          '/calculation/A1234AA/cancelCalculation?redirectUrl=/calculation/A1234AA/manual-entry/select-dates',
        )
      })
  })

  it('GET /calculation/:nomsId/manual-entry/confirmation shows confirmation page with mini profile', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    manualCalculationService.hasRecallSentences.mockResolvedValue(false)
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue([
      {
        type: 'UNSUPPORTED_SENTENCE',
      } as ValidationMessage,
    ])
    sessionSetup.sessionDoctor = req => {
      req.session.selectedManualEntryDates = {
        A1234AA: [
          {
            position: 1,
            dateType: 'CRD',
            completed: true,
            manualEntrySelectedDate: {
              dateType: 'CRD',
              dateText: 'CRD (Conditional release date)',
              date: { day: 3, month: 3, year: 2017 },
            },
          } as ManualJourneySelectedDate,
        ],
      }
      req.session.calculationReasonId = 1
      req.session.manualEntryRoutingForBookings = []
    }

    return request(app)
      .get('/calculation/A1234AA/manual-entry/confirmation')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expectMiniProfile(res.text, expectedMiniProfile)
        const $ = cheerio.load(res.text)
        expect($('[data-qa=cancel-link]').first().attr('href')).toStrictEqual(
          '/calculation/A1234AA/cancelCalculation?redirectUrl=/calculation/A1234AA/manual-entry/confirmation',
        )
      })
  })

  it('GET /calculation/:nomsId/manual-entry/confirmation redirects to select dates page if no dates are present', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    manualCalculationService.hasRecallSentences.mockResolvedValue(false)
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue([
      {
        type: 'UNSUPPORTED_SENTENCE',
      } as ValidationMessage,
    ])
    sessionSetup.sessionDoctor = req => {
      req.session.selectedManualEntryDates = []
      req.session.calculationReasonId = 1
      req.session.manualEntryRoutingForBookings = []
    }

    return request(app)
      .get('/calculation/A1234AA/manual-entry/confirmation')
      .expect(302)
      .expect('Location', '/calculation/A1234AA/manual-entry/select-dates')
  })

  it('GET /calculation/:nomsId/manual-entry/enter-date shows enter date page with mini profile and correct heading', () => {
    manualCalculationService.hasRecallSentences.mockResolvedValue(false)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue([
      {
        type: 'UNSUPPORTED_SENTENCE',
      } as ValidationMessage,
    ])
    sessionSetup.sessionDoctor = req => {
      req.session.selectedManualEntryDates = {}
      req.session.calculationReasonId = 1
      req.session.selectedManualEntryDates.A1234AA = [
        {
          dateType: 'CRD',
          dateText: 'CRD (Conditional release date)',
          date: { day: 3, month: 3, year: 2017 },
        } as ManualEntrySelectedDate,
      ]
      req.session.manualEntryRoutingForBookings = []
    }
    jest.spyOn(manualEntryService, 'getNextDateToEnter').mockReturnValue({
      position: 1,
      dateType: 'CRD',
      completed: false,
      manualEntrySelectedDate: {
        dateType: 'CRD',
        dateText: 'CRD (Conditional release date)',
        date: { day: 3, month: 3, year: 2017 },
      },
    } as ManualJourneySelectedDate)

    return request(app)
      .get('/calculation/A1234AA/manual-entry/enter-date')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-qa=cancel-link]').first().attr('href')).toStrictEqual(
          '/calculation/A1234AA/cancelCalculation?redirectUrl=/calculation/A1234AA/manual-entry/enter-date',
        )
        const questionTitle = $('.govuk-fieldset__heading').first()
        expect(questionTitle.text().trim()).toStrictEqual('Enter the CRD')
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })

  it('GET /calculation/:nomsId/manual-entry/enter-date with query param shows correct heading for date edit', () => {
    manualCalculationService.hasRecallSentences.mockResolvedValue(false)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue([
      {
        type: 'UNSUPPORTED_SENTENCE',
      } as ValidationMessage,
    ])
    sessionSetup.sessionDoctor = req => {
      req.session.selectedManualEntryDates = {}
      req.session.calculationReasonId = 1
      req.session.selectedManualEntryDates.A1234AA = [
        {
          dateType: 'CRD',
          dateText: 'CRD (Conditional release date)',
          date: { day: 3, month: 3, year: 2017 },
        } as ManualEntrySelectedDate,
      ]
      req.session.manualEntryRoutingForBookings = []
    }
    jest.spyOn(manualEntryService, 'getNextDateToEnter').mockReturnValue({
      position: 1,
      dateType: 'CRD',
      completed: false,
      manualEntrySelectedDate: {
        dateType: 'CRD',
        dateText: 'CRD (Conditional release date)',
        date: { day: 3, month: 3, year: 2017 },
      },
    } as ManualJourneySelectedDate)

    return request(app)
      .get('/calculation/A1234AA/manual-entry/enter-date?year=2026&month=09&day=22')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-qa=cancel-link]').first().attr('href')).toStrictEqual(
          '/calculation/A1234AA/cancelCalculation?redirectUrl=/calculation/A1234AA/manual-entry/enter-date?year=2026&month=09&day=22',
        )
        const questionTitle = $('.govuk-fieldset__heading').first()
        expect(questionTitle.text().trim()).toStrictEqual('Enter the CRD')
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })

  it('POST /calculation/:nomsId/manual-entry/enter-date shows enter date page with mini profile', () => {
    manualCalculationService.hasRecallSentences.mockResolvedValue(false)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue([
      {
        type: 'UNSUPPORTED_SENTENCE',
      } as ValidationMessage,
    ])
    sessionSetup.sessionDoctor = req => {
      req.session.selectedManualEntryDates = {}
      req.session.selectedManualEntryDates.A1234AA = [
        {
          dateType: 'CRD',
          dateText: 'CRD (Conditional release date)',
          date: { day: 3, month: 3, year: 2017 },
        } as ManualEntrySelectedDate,
      ]
      req.session.calculationReasonId = 1
      req.session.manualEntryRoutingForBookings = []
    }

    jest.spyOn(manualEntryService, 'storeDate').mockReturnValue({
      success: false,
      isNone: false,
      message: 'Foo',
    } as StorageResponseModel)

    return request(app)
      .post('/calculation/A1234AA/manual-entry/enter-date')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expectMiniProfile(res.text, expectedMiniProfile)
        const $ = cheerio.load(res.text)
        expect($('[data-qa=cancel-link]').first().attr('href')).toStrictEqual(
          '/calculation/A1234AA/cancelCalculation?redirectUrl=/calculation/A1234AA/manual-entry/enter-date',
        )
      })
  })

  it('GET /calculation/:nomsId/manual-entry/select-dates shows select dates page with mini profile', () => {
    manualCalculationService.hasRecallSentences.mockResolvedValue(false)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue([
      {
        type: 'UNSUPPORTED_SENTENCE',
      } as ValidationMessage,
    ])

    return request(app)
      .get('/calculation/A1234AA/manual-entry/select-dates')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expectMiniProfile(res.text, expectedMiniProfile)
        const $ = cheerio.load(res.text)
        expect($('[data-qa=cancel-link]').first().attr('href')).toStrictEqual(
          '/calculation/A1234AA/cancelCalculation?redirectUrl=/calculation/A1234AA/manual-entry/select-dates',
        )
      })
  })

  it('POST /calculation/:nomsId/manual-entry/select-dates shows select dates page with mini profile if there is an error', () => {
    manualCalculationService.hasRecallSentences.mockResolvedValue(false)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue([
      {
        type: 'UNSUPPORTED_SENTENCE',
      } as ValidationMessage,
    ])
    jest.spyOn(manualEntryService, 'verifySelectedDateType').mockResolvedValue({
      error: true,
      config: undefined,
    })
    return request(app)
      .post('/calculation/A1234AA/manual-entry/select-dates')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expectMiniProfile(res.text, expectedMiniProfile)
        const $ = cheerio.load(res.text)
        expect($('[data-qa=cancel-link]').first().attr('href')).toStrictEqual(
          '/calculation/A1234AA/cancelCalculation?redirectUrl=/calculation/A1234AA/manual-entry/select-dates',
        )
      })
  })

  it('POST /calculation/:nomsId/manual-entry/no-dates-confirmation shows no dates confirmation page with mini profile', () => {
    manualCalculationService.hasRecallSentences.mockResolvedValue(false)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue([
      {
        type: 'UNSUPPORTED_SENTENCE',
      } as ValidationMessage,
    ])
    sessionSetup.sessionDoctor = req => {
      req.session.selectedManualEntryDates = {}
      req.session.calculationReasonId = 1
      req.session.manualEntryRoutingForBookings = []
    }
    return request(app)
      .post('/calculation/A1234AA/manual-entry/no-dates-confirmation')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expectMiniProfile(res.text, expectedMiniProfile)
        const $ = cheerio.load(res.text)
        expect($('[data-qa=cancel-link]').first().attr('href')).toStrictEqual(
          '/calculation/A1234AA/cancelCalculation?redirectUrl=/calculation/A1234AA/manual-entry/no-dates-confirmation',
        )
      })
  })

  it('GET /calculation/:nomsId/manual-entry/remove-date should show the remove date page with mini profile', () => {
    manualCalculationService.hasRecallSentences.mockResolvedValue(false)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue([
      {
        type: 'UNSUPPORTED_SENTENCE',
      } as ValidationMessage,
    ])
    sessionSetup.sessionDoctor = req => {
      req.session.selectedManualEntryDates = {}
      req.session.calculationReasonId = 1
      req.session.selectedManualEntryDates.A1234AA = [
        {
          dateType: 'CRD',
          dateText: 'CRD (Conditional release date)',
          date: { day: 3, month: 3, year: 2017 },
        } as ManualEntrySelectedDate,
      ]
      req.session.manualEntryRoutingForBookings = []
    }
    return request(app)
      .get('/calculation/A1234AA/manual-entry/remove-date?dateType=CRD')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-qa=cancel-link]').first().attr('href')).toStrictEqual(
          '/calculation/A1234AA/cancelCalculation?redirectUrl=/calculation/A1234AA/manual-entry/remove-date?dateType=CRD',
        )
        expect(res.text).toContain('Are you sure you want to delete the CRD (Conditional release date)?')
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })

  it('POST /calculation/:nomsId/manual-entry/remove-date should show the delete date page with mini profile if no confirmation option selected', () => {
    manualCalculationService.hasRecallSentences.mockResolvedValue(false)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue([
      {
        type: 'UNSUPPORTED_SENTENCE',
      } as ValidationMessage,
    ])
    return request(app)
      .post('/calculation/A1234AA/manual-entry/remove-date?dateType=CRD')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expectMiniProfile(res.text, expectedMiniProfile)
        const $ = cheerio.load(res.text)
        expect($('[data-qa=cancel-link]').first().attr('href')).toStrictEqual(
          '/calculation/A1234AA/cancelCalculation?redirectUrl=/calculation/A1234AA/manual-entry/remove-date?dateType=CRD',
        )
      })
  })

  it('GET /calculation/:nomsId/manual-entry/save should redirect when no reasonId is within the session', () => {
    sessionSetup.sessionDoctor = req => {
      req.session.manualEntryRoutingForBookings = []
    }
    manualCalculationService.hasRecallSentences.mockResolvedValue(false)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .get('/calculation/A1234AA/manual-entry/save')
      .expect(302)
      .expect('Location', '/calculation/A1234AA/reason')
  })
})

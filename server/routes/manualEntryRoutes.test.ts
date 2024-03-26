import request from 'supertest'
import type { Express } from 'express'
import nock from 'nock'
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
import ManualEntryValidationService from '../services/manualEntryValidationService'
import DateTypeConfigurationService from '../services/dateTypeConfigurationService'
import DateValidationService, { StorageResponseModel } from '../services/dateValidationService'
import { expectMiniProfile } from './testutils/layoutExpectations'
import SessionSetup from './testutils/sessionSetup'
import config from '../config'
import { testDateTypeDefinitions } from '../testutils/createUserToken'

jest.mock('../services/prisonerService')
jest.mock('../services/calculateReleaseDatesService')
jest.mock('../services/manualCalculationService')

const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const calculateReleaseDatesService = new CalculateReleaseDatesService() as jest.Mocked<CalculateReleaseDatesService>
const manualCalculationService = new ManualCalculationService() as jest.Mocked<ManualCalculationService>
const manualEntryValidationService = new ManualEntryValidationService()
const dateTypeConfigurationService = new DateTypeConfigurationService()
const dateValidationService = new DateValidationService()
const manualEntryService = new ManualEntryService(
  manualEntryValidationService,
  dateTypeConfigurationService,
  dateValidationService,
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
  config.apis.calculateReleaseDates.url = 'http://localhost:8100'
  fakeApi = nock(config.apis.calculateReleaseDates.url)
  fakeApi.get('/reference-data/date-type', '').reply(200, testDateTypeDefinitions).persist()
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

describe('Tests for /calculation/:nomsId/manual-entry', () => {
  it('GET if there are no unsupported sentences the page re-directs', () => {
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue(stubbedEmptyMessages)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)

    return request(app)
      .get('/calculation/A1234AA/manual-entry')
      .expect(302)
      .expect(res => {
        expect(res.redirect).toBeTruthy()
      })
  })

  it('GET if there are unsupported sentences the page display correctly', () => {
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue([
      {
        type: 'UNSUPPORTED_SENTENCE',
      } as ValidationMessage,
    ])
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    manualCalculationService.hasIndeterminateSentences.mockResolvedValue(false)

    return request(app)
      .get('/calculation/A1234AA/manual-entry')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Manual calculation required')
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })

  it('GET if there are indeterminate sentences then should have correct content', () => {
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
      })
  })

  it('GET if there are determinate sentences then should have correct data', () => {
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
      })
  })

  it('POST if a date type has been selected should redirect', () => {
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
      })
  })

  it('GET /calculation/:nomsId/manual-entry/confirmation shows confirmation page with mini profile', () => {
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
    }

    return request(app)
      .get('/calculation/A1234AA/manual-entry/confirmation')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })

  it('GET /calculation/:nomsId/manual-entry/enter-date shows enter date page with mini profile', () => {
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
    }
    jest.spyOn(manualEntryService, 'getNextDateToEnter').mockReturnValue({
      dateType: 'CRD',
      dateText: 'CRD (Conditional release date)',
      date: { day: 3, month: 3, year: 2017 },
    } as ManualEntrySelectedDate)

    return request(app)
      .get('/calculation/A1234AA/manual-entry/enter-date')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })

  it('POST /calculation/:nomsId/manual-entry/enter-date shows enter date page with mini profile', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue([
      {
        type: 'UNSUPPORTED_SENTENCE',
      } as ValidationMessage,
    ])
    sessionSetup.sessionDoctor = req => {
      req.session.selectedManualEntryDates = {}
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
      })
  })

  it('GET /calculation/:nomsId/manual-entry/select-dates shows select dates page with mini profile', () => {
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
      })
  })

  it('POST /calculation/:nomsId/manual-entry/select-dates shows select dates page with mini profile if there is an error', () => {
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
      })
  })

  it('POST /calculation/:nomsId/manual-entry/no-dates-confirmation shows no dates confirmation page with mini profile', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue([
      {
        type: 'UNSUPPORTED_SENTENCE',
      } as ValidationMessage,
    ])
    sessionSetup.sessionDoctor = req => {
      req.session.selectedManualEntryDates = {}
    }
    return request(app)
      .post('/calculation/A1234AA/manual-entry/no-dates-confirmation')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })

  it('GET /calculation/:nomsId/manual-entry/remove-date should show the remove date page with mini profile', () => {
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
    }
    return request(app)
      .get('/calculation/A1234AA/manual-entry/remove-date?dateType=CRD')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })

  it('POST /calculation/:nomsId/manual-entry/remove-date should show the remove date page with mini profile if no confirmation option selected', () => {
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
      })
  })
})

import request from 'supertest'
import type { Express } from 'express'
import { appWithAllRoutes } from './testutils/appSetup'
import PrisonerService from '../services/prisonerService'
import { PrisonApiPrisoner, PrisonApiSentenceDetail } from '../@types/prisonApi/prisonClientTypes'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import { ValidationMessage } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ManualCalculationService from '../services/manualCalculationService'

jest.mock('../services/prisonerService')
jest.mock('../services/calculateReleaseDatesService')
jest.mock('../services/manualCalculationService')

const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const calculateReleaseDatesService = new CalculateReleaseDatesService() as jest.Mocked<CalculateReleaseDatesService>
const manualCalculationService = new ManualCalculationService() as jest.Mocked<ManualCalculationService>

let app: Express

const stubbedEmptyMessages: ValidationMessage[] = []

const stubbedPrisonerData = {
  offenderNo: 'A1234AA',
  firstName: 'Anon',
  lastName: 'Nobody',
  latestLocationId: 'LEI',
  locationDescription: 'Inside - Leeds HMP',
  dateOfBirth: '24/06/2000',
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
} as PrisonApiPrisoner

beforeEach(() => {
  app = appWithAllRoutes({
    calculateReleaseDatesService,
    prisonerService,
    manualCalculationService,
  })
})

afterEach(() => {
  jest.resetAllMocks()
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
      })
  })

  it('GET if there are indeterminate sentences then href routes to correct page', () => {
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue([
      {
        type: 'UNSUPPORTED_SENTENCE',
      } as ValidationMessage,
    ])
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    manualCalculationService.hasIndeterminateSentences.mockResolvedValue(true)

    return request(app)
      .get('/calculation/A1234AA/manual-entry')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          `/calculation/${stubbedPrisonerData.offenderNo}/manual-entry/indeterminate-date-selection`
        )
      })
  })

  it('GET if there are determinate sentences then href routes to correct page', () => {
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
        expect(res.text).toContain(
          `/calculation/${stubbedPrisonerData.offenderNo}/manual-entry/determinate-date-selection`
        )
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
      .post('/calculation/A1234AA/manual-entry/determinate-date-selection')
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
      .post('/calculation/A1234AA/manual-entry/determinate-date-selection')
      .type('form')
      .send({ dateSelect: undefined })
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Select at least one release date.')
      })
  })
})

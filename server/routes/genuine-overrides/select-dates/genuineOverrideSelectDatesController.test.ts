import { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../testutils/appSetup'
import SessionSetup from '../../testutils/sessionSetup'
import PrisonerService from '../../../services/prisonerService'
import { PrisonApiPrisoner } from '../../../@types/prisonApi/prisonClientTypes'
import DateTypeConfigurationService from '../../../services/dateTypeConfigurationService'
import { determinateDateTypesForManualEntry } from '../../../services/manualEntryService'
import AuthorisedRoles from '../../../enumerations/authorisedRoles'
import { testDateTypeToDescriptions } from '../../../testutils/createUserToken'
import CalculateReleaseDatesService from '../../../services/calculateReleaseDatesService'
import { GenuineOverrideInputs } from '../../../@types/journeys'

jest.mock('../../../services/prisonerService')
jest.mock('../../../services/dateTypeConfigurationService')
jest.mock('../../../services/calculateReleaseDatesService')

describe('SelectGenuineOverrideReasonController', () => {
  let app: Express
  const sessionSetup = new SessionSetup()

  const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
  const dateTypeConfigurationService = new DateTypeConfigurationService() as jest.Mocked<DateTypeConfigurationService>
  const calculateReleaseDatesService = new CalculateReleaseDatesService(
    null,
  ) as jest.Mocked<CalculateReleaseDatesService>

  let genuineOverrideInputs: GenuineOverrideInputs
  const prisonerNumber = 'A1234BC'
  const calculationRequestId = 465987
  const stubbedPrisonerData = {
    offenderNo: prisonerNumber,
    firstName: 'Anon',
    lastName: 'Nobody',
  } as PrisonApiPrisoner
  const pageUrl = `/calculation/${prisonerNumber}/override/select-dates/${calculationRequestId}`
  let currentUser: Express.User

  beforeEach(() => {
    genuineOverrideInputs = {
      mode: 'STANDARD',
      reason: 'TERRORISM',
      datesToSave: [
        { type: 'SLED', date: '2032-06-15' },
        { type: 'CRD', date: '2025-06-15' },
      ],
    }
    sessionSetup.sessionDoctor = req => {
      req.session.genuineOverrideInputs = {}
      req.session.genuineOverrideInputs[prisonerNumber] = genuineOverrideInputs
    }
    currentUser = {
      ...user,
      userRoles: [AuthorisedRoles.ROLE_RELEASE_DATES_CALCULATOR, AuthorisedRoles.ROLE_CRD__GENUINE_OVERRIDES__RW],
    }
    app = appWithAllRoutes({
      services: {
        prisonerService,
        dateTypeConfigurationService,
        calculateReleaseDatesService,
      },
      sessionSetup,
      userSupplier: () => currentUser,
    })
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    dateTypeConfigurationService.dateTypeToDescriptionMapping.mockResolvedValue(testDateTypeToDescriptions)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should load page and render correct navigation', async () => {
      const response = await request(app).get(pageUrl)

      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      expect($('[data-qa=back-link]').attr('href')).toStrictEqual(
        `/calculation/${prisonerNumber}/review-dates-for-override/${calculationRequestId}`,
      )
      expect($('[data-qa=cancel-link]').attr('href')).toStrictEqual(
        `/calculation/${prisonerNumber}/cancelCalculation?redirectUrl=${pageUrl}`,
      )
    })

    it('should show list of dates with the ones already added being disabled ', async () => {
      const response = await request(app).get(pageUrl)

      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      determinateDateTypesForManualEntry.forEach(expectedRadio => {
        const radio = $(`[data-qa=checkbox-${expectedRadio}]`)
        expect(radio).toHaveLength(1)
        if (['CRD', 'SLED'].includes(expectedRadio)) {
          expect(radio.attr('checked')).toStrictEqual('checked')
          expect(radio.attr('disabled')).toStrictEqual('disabled')
        } else {
          expect(radio.attr('checked')).toBeUndefined()
          expect(radio.attr('disabled')).toBeUndefined()
        }
      })
    })

    it('should show list of dates with the ones already added being disabled and pending ones just ticked but not disabled', async () => {
      genuineOverrideInputs.datesToSave = [{ type: 'CRD', date: '2021-02-03' }]
      genuineOverrideInputs.datesBeingAdded = [{ type: 'HDCED' }]
      const response = await request(app).get(pageUrl)
      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      const crdRadio = $(`[data-qa=checkbox-CRD]`)
      expect(crdRadio.attr('checked')).toStrictEqual('checked')
      expect(crdRadio.attr('disabled')).toStrictEqual('disabled')
      const hdcedRadio = $(`[data-qa=checkbox-HDCED]`)
      expect(hdcedRadio.attr('checked')).toStrictEqual('checked')
      expect(hdcedRadio.attr('disabled')).toBeUndefined()
    })
  })

  describe('POST', () => {
    it('should return to review dates if no dates were selected at all', async () => {
      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({})
        .expect(302)
        .expect('Location', `/calculation/${prisonerNumber}/review-dates-for-override/${calculationRequestId}`)

      // should not have set anything on inputs
      expect(genuineOverrideInputs).toStrictEqual({
        mode: 'STANDARD',
        reason: 'TERRORISM',
        datesToSave: [
          { type: 'SLED', date: '2032-06-15' },
          { type: 'CRD', date: '2025-06-15' },
        ],
      })
    })

    it('should return to review dates if no new date types were selected', async () => {
      calculateReleaseDatesService.validateDatesForGenuineOverride.mockResolvedValue([])
      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({ dateType: ['SLED', 'CRD'] })
        .expect(302)
        .expect('Location', `/calculation/${prisonerNumber}/review-dates-for-override/${calculationRequestId}`)

      // should not have set anything on inputs
      expect(genuineOverrideInputs).toStrictEqual({
        mode: 'STANDARD',
        reason: 'TERRORISM',
        datesToSave: [
          { type: 'SLED', date: '2032-06-15' },
          { type: 'CRD', date: '2025-06-15' },
        ],
      })
    })

    it('should go to the first selected reason page and persist adding dates to the genuine override inputs', async () => {
      calculateReleaseDatesService.validateDatesForGenuineOverride.mockResolvedValue([])
      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({ dateType: ['SLED', 'CRD', 'HDCED', 'TUSED'] })
        .expect(302)
        .expect('Location', `/calculation/${prisonerNumber}/override/HDCED/add/${calculationRequestId}`)

      expect(genuineOverrideInputs).toStrictEqual({
        mode: 'STANDARD',
        reason: 'TERRORISM',
        datesToSave: [
          { type: 'SLED', date: '2032-06-15' },
          { type: 'CRD', date: '2025-06-15' },
        ],
        datesBeingAdded: [{ type: 'HDCED' }, { type: 'TUSED' }],
      })
    })

    it('should handle only one date being added', async () => {
      calculateReleaseDatesService.validateDatesForGenuineOverride.mockResolvedValue([])
      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({ dateType: 'HDCED' })
        .expect(302)
        .expect('Location', `/calculation/${prisonerNumber}/override/HDCED/add/${calculationRequestId}`)

      expect(genuineOverrideInputs).toStrictEqual({
        mode: 'STANDARD',
        reason: 'TERRORISM',
        datesToSave: [
          { type: 'SLED', date: '2032-06-15' },
          { type: 'CRD', date: '2025-06-15' },
        ],
        datesBeingAdded: [{ type: 'HDCED' }],
      })
    })

    it('should return to input page if backend validation of dates fails', async () => {
      calculateReleaseDatesService.validateDatesForGenuineOverride.mockResolvedValue([
        { code: 'DATES_MISSING_REQUIRED_TYPE', message: 'Error 1', type: 'VALIDATION', arguments: [] },
        { code: 'DATES_PAIRINGS_INVALID', message: 'Error 2', type: 'VALIDATION', arguments: [] },
      ])
      genuineOverrideInputs.datesToSave = [
        { type: 'SLED', date: '2032-06-15' },
        { type: 'CRD', date: '2025-06-15' },
      ]

      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({ dateType: ['HDCED', 'TUSED'] })
        .expect(302)
        .expect('Location', `${pageUrl}#`)

      expect(genuineOverrideInputs).toStrictEqual({
        mode: 'STANDARD',
        reason: 'TERRORISM',
        datesToSave: [
          { type: 'SLED', date: '2032-06-15' },
          { type: 'CRD', date: '2025-06-15' },
        ],
      })
    })
  })
})

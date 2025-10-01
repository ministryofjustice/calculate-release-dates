import { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from '../../testutils/appSetup'
import SessionSetup from '../../testutils/sessionSetup'
import { GenuineOverrideInputs } from '../../../models/genuine-override/genuineOverrideInputs'
import PrisonerService from '../../../services/prisonerService'
import { PrisonApiPrisoner } from '../../../@types/prisonApi/prisonClientTypes'
import DateTypeConfigurationService from '../../../services/dateTypeConfigurationService'
import { determinateDateTypesForManualEntry } from '../../../services/manualEntryService'

jest.mock('../../../services/prisonerService')
jest.mock('../../../services/dateTypeConfigurationService')

describe('SelectGenuineOverrideReasonController', () => {
  let app: Express
  const sessionSetup = new SessionSetup()

  const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
  const dateTypeConfigurationService = new DateTypeConfigurationService() as jest.Mocked<DateTypeConfigurationService>

  let genuineOverrideInputs: GenuineOverrideInputs
  const prisonerNumber = 'A1234BC'
  const calculationRequestId = 465987
  const stubbedPrisonerData = {
    offenderNo: prisonerNumber,
    firstName: 'Anon',
    lastName: 'Nobody',
  } as PrisonApiPrisoner
  const pageUrl = `/calculation/${prisonerNumber}/override/select-dates/${calculationRequestId}`

  const mockDateConfigs = {
    CRD: 'CRD (Conditional release date)',
    LED: 'LED (Licence expiry date)',
    SED: 'SED (Sentence expiry date)',
    NPD: 'NPD (Non-parole date)',
    ARD: 'ARD (Automatic release date)',
    TUSED: 'TUSED (Top up supervision expiry date)',
    PED: 'PED (Parole eligibility date)',
    SLED: 'SLED (Sentence and licence expiry date)',
    HDCED: 'HDCED (Home detention curfew eligibility date)',
    NCRD: 'NCRD (Notional conditional release date)',
    ETD: 'ETD (Early transfer date)',
    MTD: 'MTD (Mid transfer date)',
    LTD: 'LTD (Late transfer date)',
    DPRRD: 'DPRRD (Detention and training order post recall release date)',
    PRRD: 'PRRD (Post recall release date)',
    ESED: 'ESED (Effective sentence end date)',
    ERSED: 'ERSED (Early removal scheme eligibility date)',
    TERSED: 'TERSED (Tariff-expired removal scheme eligibility date)',
    APD: 'APD (Approved parole date)',
    HDCAD: 'HDCAD (Home detention curfew approved date)',
    None: 'None (None of the above dates apply)',
    Tariff: 'Tariff (known as the Tariff expiry date)',
    ROTL: 'ROTL (Release on temporary licence)',
  }

  beforeEach(() => {
    genuineOverrideInputs = {
      state: 'INITIALISED_DATES',
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

    app = appWithAllRoutes({
      services: {
        prisonerService,
        dateTypeConfigurationService,
      },
      sessionSetup,
    })
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    dateTypeConfigurationService.dateTypeToDescriptionMapping.mockResolvedValue(mockDateConfigs)
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

    it('should show list of dates with the ones already added being disabled', async () => {
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
  })

  describe('POST', () => {
    it('should return to input page with errors set if there was nothing selected', async () => {
      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({})
        .expect(302)
        .expect('Location', `${pageUrl}#`)

      // should not have set anything on inputs
      expect(genuineOverrideInputs).toStrictEqual({
        state: 'INITIALISED_DATES',
        reason: 'TERRORISM',
        datesToSave: [
          { type: 'SLED', date: '2032-06-15' },
          { type: 'CRD', date: '2025-06-15' },
        ],
      })
    })

    it('should return to review dates if no new date types were selected', async () => {
      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({ dateType: ['SLED', 'CRD'] })
        .expect(302)
        .expect('Location', `/calculation/${prisonerNumber}/review-dates-for-override/${calculationRequestId}`)

      // should not have set anything on inputs
      expect(genuineOverrideInputs).toStrictEqual({
        state: 'INITIALISED_DATES',
        reason: 'TERRORISM',
        datesToSave: [
          { type: 'SLED', date: '2032-06-15' },
          { type: 'CRD', date: '2025-06-15' },
        ],
        datesBeingAdded: [],
      })
    })

    it('should go to the first selected reason page and persist adding dates to the genuine override inputs', async () => {
      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({ dateType: ['SLED', 'CRD', 'HDCED', 'TUSED'] })
        .expect(302)
        .expect('Location', `/calculation/${prisonerNumber}/override/HDCED/add/${calculationRequestId}`)

      expect(genuineOverrideInputs).toStrictEqual({
        state: 'INITIALISED_DATES',
        reason: 'TERRORISM',
        datesToSave: [
          { type: 'SLED', date: '2032-06-15' },
          { type: 'CRD', date: '2025-06-15' },
        ],
        datesBeingAdded: [{ type: 'HDCED' }, { type: 'TUSED' }],
      })
    })

    it('should handle only one date being added', async () => {
      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({ dateType: 'HDCED' })
        .expect(302)
        .expect('Location', `/calculation/${prisonerNumber}/override/HDCED/add/${calculationRequestId}`)

      expect(genuineOverrideInputs).toStrictEqual({
        state: 'INITIALISED_DATES',
        reason: 'TERRORISM',
        datesToSave: [
          { type: 'SLED', date: '2032-06-15' },
          { type: 'CRD', date: '2025-06-15' },
        ],
        datesBeingAdded: [{ type: 'HDCED' }],
      })
    })
  })
})

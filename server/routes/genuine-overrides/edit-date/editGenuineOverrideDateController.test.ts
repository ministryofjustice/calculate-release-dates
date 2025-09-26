import { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, flashProvider } from '../../testutils/appSetup'
import SessionSetup from '../../testutils/sessionSetup'
import { GenuineOverrideInputs } from '../../../models/genuine-override/genuineOverrideInputs'
import PrisonerService from '../../../services/prisonerService'
import { PrisonApiPrisoner } from '../../../@types/prisonApi/prisonClientTypes'
import DateTypeConfigurationService from '../../../services/dateTypeConfigurationService'

jest.mock('../../../services/dateTypeConfigurationService')
jest.mock('../../../services/prisonerService')

describe('AddGenuineOverrideDateController', () => {
  let app: Express
  const sessionSetup = new SessionSetup()

  const dateTypeConfigurationService = new DateTypeConfigurationService() as jest.Mocked<DateTypeConfigurationService>
  const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>

  let genuineOverrideInputs: GenuineOverrideInputs
  const prisonerNumber = 'A1234BC'
  const calculationRequestId = 465987
  const stubbedPrisonerData = {
    offenderNo: prisonerNumber,
    firstName: 'Anon',
    lastName: 'Nobody',
  } as PrisonApiPrisoner
  const pageUrl = `/calculation/${prisonerNumber}/override/HDCED/edit/${calculationRequestId}`

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
    genuineOverrideInputs = {}
    sessionSetup.sessionDoctor = req => {
      req.session.genuineOverrideInputs = {}
      req.session.genuineOverrideInputs[prisonerNumber] = genuineOverrideInputs
    }

    app = appWithAllRoutes({
      services: {
        dateTypeConfigurationService,
        prisonerService,
      },
      sessionSetup,
    })
    dateTypeConfigurationService.dateTypeToDescriptionMapping.mockResolvedValue(mockDateConfigs)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should load page and render correct navigation', async () => {
      genuineOverrideInputs.datesToSave = [
        { type: 'CRD', date: '2025-06-15' },
        { type: 'HDCED', date: '2015-12-25' },
      ]

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

    it('should return to review dates if this date is not in the session to be added, e.g., using browser back or typing a URL', async () => {
      genuineOverrideInputs.datesToSave = [{ type: 'CRD', date: '2025-06-15' }]

      await request(app)
        .get(pageUrl)
        .expect(302)
        .expect('Location', `/calculation/${prisonerNumber}/review-dates-for-override/${calculationRequestId}`)
    })

    it('should show values from user if there was a validation error', async () => {
      genuineOverrideInputs.datesToSave = [{ type: 'HDCED', date: '2015-12-25' }]
      const form = { day: 'FOO', month: 'X', year: '2000' }
      flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))

      const response = await request(app).get(pageUrl)

      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      expect($('#day').val()).toStrictEqual('FOO')
      expect($('#month').val()).toStrictEqual('X')
      expect($('#year').val()).toStrictEqual('2000')
    })

    it('should maintain values from user if there was a validation error even if there is an existing value in the session', async () => {
      const form = { day: 'FOO', month: '10', year: '2000' }
      flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))
      genuineOverrideInputs.datesToSave = [{ type: 'HDCED', date: '2015-12-25' }]

      const response = await request(app).get(pageUrl)

      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      expect($('#day').val()).toStrictEqual('FOO')
      expect($('#month').val()).toStrictEqual('10')
      expect($('#year').val()).toStrictEqual('2000')
    })

    it('should use existing value in the session if there is no validation error', async () => {
      genuineOverrideInputs.datesToSave = [{ type: 'HDCED', date: '2015-12-25' }]

      const response = await request(app).get(pageUrl)

      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      expect($('#day').val()).toStrictEqual('25')
      expect($('#month').val()).toStrictEqual('12')
      expect($('#year').val()).toStrictEqual('2015')
    })
  })

  describe('POST', () => {
    it('should return to input page without saving the date if there were errors ', async () => {
      const originalHdced = { type: 'HDCED', date: '2010-10-11' }
      genuineOverrideInputs.datesToSave = [originalHdced]

      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({ day: '30', month: '2', year: '2025' })
        .expect(302)
        .expect('Location', `${pageUrl}#`)

      expect(genuineOverrideInputs).toStrictEqual({ datesToSave: [originalHdced] })
    })

    it('should return the review page with updated dates if valid ', async () => {
      genuineOverrideInputs.datesToSave = [{ type: 'HDCED', date: '2010-10-11' }]

      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({ day: '28', month: '2', year: '2025' })
        .expect(302)
        .expect('Location', `/calculation/${prisonerNumber}/review-dates-for-override/${calculationRequestId}`)

      expect(genuineOverrideInputs).toStrictEqual({
        datesToSave: [{ type: 'HDCED', date: '2025-02-28' }],
      })
    })
  })
})

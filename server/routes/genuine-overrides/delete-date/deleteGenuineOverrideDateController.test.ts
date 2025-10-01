import { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from '../../testutils/appSetup'
import SessionSetup from '../../testutils/sessionSetup'
import { GenuineOverrideInputs } from '../../../models/genuine-override/genuineOverrideInputs'
import PrisonerService from '../../../services/prisonerService'
import { PrisonApiPrisoner } from '../../../@types/prisonApi/prisonClientTypes'
import DateTypeConfigurationService from '../../../services/dateTypeConfigurationService'

jest.mock('../../../services/dateTypeConfigurationService')
jest.mock('../../../services/prisonerService')

describe('DeleteGenuineOverrideDateController', () => {
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
  const pageUrl = `/calculation/${prisonerNumber}/override/HDCED/delete/${calculationRequestId}`

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
    genuineOverrideInputs = { state: 'INITIALISED_DATES' }
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
  })

  describe('POST', () => {
    it('should return to input page without removing the date if there were errors ', async () => {
      const originalHdced = { type: 'HDCED', date: '2010-10-11' }
      genuineOverrideInputs.datesToSave = [originalHdced]

      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({})
        .expect(302)
        .expect('Location', `${pageUrl}#`)

      expect(genuineOverrideInputs).toStrictEqual({ state: 'INITIALISED_DATES', datesToSave: [originalHdced] })
    })

    it('should delete the date and return the review page if YES was selected ', async () => {
      genuineOverrideInputs.datesToSave = [
        { type: 'CRD', date: '2011-11-12' },
        { type: 'HDCED', date: '2010-10-11' },
        { type: 'TUSED', date: '2025-09-15' },
      ]

      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({ confirmDeleteDate: 'YES' })
        .expect(302)
        .expect('Location', `/calculation/${prisonerNumber}/review-dates-for-override/${calculationRequestId}`)

      expect(genuineOverrideInputs).toStrictEqual({
        state: 'INITIALISED_DATES',
        datesToSave: [
          { type: 'CRD', date: '2011-11-12' },
          { type: 'TUSED', date: '2025-09-15' },
        ],
      })
    })

    it('should return to the review page without deleting dates if NO was selected ', async () => {
      genuineOverrideInputs.datesToSave = [
        { type: 'CRD', date: '2011-11-12' },
        { type: 'HDCED', date: '2010-10-11' },
        { type: 'TUSED', date: '2025-09-15' },
      ]

      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({ confirmDeleteDate: 'NO' })
        .expect(302)
        .expect('Location', `/calculation/${prisonerNumber}/review-dates-for-override/${calculationRequestId}`)

      expect(genuineOverrideInputs).toStrictEqual({
        state: 'INITIALISED_DATES',
        datesToSave: [
          { type: 'CRD', date: '2011-11-12' },
          { type: 'HDCED', date: '2010-10-11' },
          { type: 'TUSED', date: '2025-09-15' },
        ],
      })
    })
  })
})

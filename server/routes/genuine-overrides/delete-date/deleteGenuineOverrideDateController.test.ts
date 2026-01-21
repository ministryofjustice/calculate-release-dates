import { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../testutils/appSetup'
import SessionSetup from '../../testutils/sessionSetup'
import PrisonerService from '../../../services/prisonerService'
import { PrisonApiPrisoner } from '../../../@types/prisonApi/prisonClientTypes'
import DateTypeConfigurationService from '../../../services/dateTypeConfigurationService'
import AuthorisedRoles from '../../../enumerations/authorisedRoles'
import { testDateTypeToDescriptions } from '../../../testutils/createUserToken'
import { GenuineOverrideInputs } from '../../../@types/journeys'

jest.mock('../../../services/dateTypeConfigurationService')
jest.mock('../../../services/prisonerService')

describe('DeleteGenuineOverrideDateController', () => {
  let app: Express
  const sessionSetup = new SessionSetup()

  const dateTypeConfigurationService = new DateTypeConfigurationService() as jest.Mocked<DateTypeConfigurationService>
  const prisonerService = new PrisonerService(null, null) as jest.Mocked<PrisonerService>

  let genuineOverrideInputs: GenuineOverrideInputs
  const prisonerNumber = 'A1234BC'
  const calculationRequestId = 465987
  const stubbedPrisonerData = {
    offenderNo: prisonerNumber,
    firstName: 'Anon',
    lastName: 'Nobody',
  } as PrisonApiPrisoner
  const pageUrl = `/calculation/${prisonerNumber}/override/HDCED/delete/${calculationRequestId}`
  let currentUser: Express.User

  beforeEach(() => {
    genuineOverrideInputs = { mode: 'STANDARD', datesToSave: [] }
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
        dateTypeConfigurationService,
        prisonerService,
      },
      sessionSetup,
      userSupplier: () => currentUser,
    })
    dateTypeConfigurationService.dateTypeToDescriptionMapping.mockResolvedValue(testDateTypeToDescriptions)
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
      // no back link as NO takes you back to the interstitial page anyway
      expect($('[data-qa=back-link]')).toHaveLength(0)
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

      expect(genuineOverrideInputs).toStrictEqual({ mode: 'STANDARD', datesToSave: [originalHdced] })
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
        mode: 'STANDARD',
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
        mode: 'STANDARD',
        datesToSave: [
          { type: 'CRD', date: '2011-11-12' },
          { type: 'HDCED', date: '2010-10-11' },
          { type: 'TUSED', date: '2025-09-15' },
        ],
      })
    })
  })
})

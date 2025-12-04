import { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, flashProvider, user } from '../../testutils/appSetup'
import SessionSetup from '../../testutils/sessionSetup'
import PrisonerService from '../../../services/prisonerService'
import { PrisonApiPrisoner } from '../../../@types/prisonApi/prisonClientTypes'
import DateTypeConfigurationService from '../../../services/dateTypeConfigurationService'
import AuthorisedRoles from '../../../enumerations/authorisedRoles'
import { testDateTypeToDescriptions } from '../../../testutils/createUserToken'
import { GenuineOverrideInputs } from '../../../@types/journeys'

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
  const pageUrl = `/calculation/${prisonerNumber}/override/TUSED/add/${calculationRequestId}`
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
    it('should load page and render correct navigation when this is the first date', async () => {
      genuineOverrideInputs.datesBeingAdded = [{ type: 'TUSED' }, { type: 'HDCED' }]

      const response = await request(app).get(pageUrl)

      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      expect($('[data-qa=back-link]').attr('href')).toStrictEqual(
        `/calculation/${prisonerNumber}/override/select-dates/${calculationRequestId}`,
      )
      expect($('[data-qa=cancel-link]').attr('href')).toStrictEqual(
        `/calculation/${prisonerNumber}/cancelCalculation?redirectUrl=${pageUrl}`,
      )
    })

    it('should load page and render correct navigation when this is not the first date', async () => {
      genuineOverrideInputs.datesBeingAdded = [{ type: 'HDCED' }, { type: 'TUSED' }]

      const response = await request(app).get(pageUrl)

      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      expect($('[data-qa=back-link]').attr('href')).toStrictEqual(
        `/calculation/${prisonerNumber}/override/HDCED/add/${calculationRequestId}`,
      )
      expect($('[data-qa=cancel-link]').attr('href')).toStrictEqual(
        `/calculation/${prisonerNumber}/cancelCalculation?redirectUrl=${pageUrl}`,
      )
    })

    it('should return to date select if this date is not in the session to be added, e.g., using browser back or typing', async () => {
      genuineOverrideInputs.datesBeingAdded = [{ type: 'HDCED' }]

      await request(app)
        .get(pageUrl)
        .expect(302)
        .expect('Location', `/calculation/${prisonerNumber}/override/select-dates/${calculationRequestId}`)
    })

    it('should show values from user if there was a validation error', async () => {
      genuineOverrideInputs.datesBeingAdded = [{ type: 'TUSED' }]
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
      const form = { day: 'FOO', month: 'X', year: '2000' }
      flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))
      genuineOverrideInputs.datesBeingAdded = [{ type: 'TUSED', day: 1, month: 2, year: 2025 }]

      const response = await request(app).get(pageUrl)

      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      expect($('#day').val()).toStrictEqual('FOO')
      expect($('#month').val()).toStrictEqual('X')
      expect($('#year').val()).toStrictEqual('2000')
    })

    it('should use existing value in the session if there is no validation error', async () => {
      genuineOverrideInputs.datesBeingAdded = [{ type: 'TUSED', day: 1, month: 2, year: 2025 }]

      const response = await request(app).get(pageUrl)

      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      expect($('#day').val()).toStrictEqual('1')
      expect($('#month').val()).toStrictEqual('2')
      expect($('#year').val()).toStrictEqual('2025')
    })

    it('should redirect to auth error if the user does not have required role', async () => {
      currentUser.userRoles = [AuthorisedRoles.ROLE_RELEASE_DATES_CALCULATOR]
      await request(app).get(pageUrl).expect(302).expect('Location', '/authError')
    })
  })

  describe('POST', () => {
    it('should return to input page without saving the date if there were errors ', async () => {
      const originalTused = { type: 'TUSED', day: 10, month: 10, year: 2010 }
      genuineOverrideInputs.datesBeingAdded = [originalTused]

      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({ day: '30', month: '2', year: '2025' })
        .expect(302)
        .expect('Location', `${pageUrl}#`)

      expect(genuineOverrideInputs).toStrictEqual({
        mode: 'STANDARD',
        datesToSave: [],
        datesBeingAdded: [originalTused],
      })
    })

    it('should return go to next input page with the date set if this is not the last date being entered ', async () => {
      genuineOverrideInputs.datesBeingAdded = [{ type: 'TUSED', day: 10, month: 10, year: 2010 }, { type: 'HDCED' }]

      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({ day: '28', month: '2', year: '2025' })
        .expect(302)
        .expect('Location', `/calculation/${prisonerNumber}/override/HDCED/add/${calculationRequestId}`)

      expect(genuineOverrideInputs).toStrictEqual({
        mode: 'STANDARD',
        datesToSave: [],
        datesBeingAdded: [{ type: 'TUSED', day: 28, month: 2, year: 2025 }, { type: 'HDCED' }],
      })
    })

    it('should save all dates in session if this the last date', async () => {
      genuineOverrideInputs.datesBeingAdded = [
        { type: 'HDCED', day: 3, month: 4, year: 2023 },
        { type: 'TUSED', day: 10, month: 10, year: 2010 },
      ]
      genuineOverrideInputs.datesToSave = []

      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({ day: '28', month: '2', year: '2025' })
        .expect(302)
        .expect('Location', `/calculation/${prisonerNumber}/review-dates-for-override/${calculationRequestId}`)

      expect(genuineOverrideInputs).toStrictEqual({
        mode: 'STANDARD',
        datesToSave: [
          { type: 'HDCED', date: '2023-04-03' },
          { type: 'TUSED', date: '2025-02-28' },
        ],
        datesBeingAdded: [],
      })
    })

    it('should redirect to auth error if the user does not have required role', async () => {
      currentUser.userRoles = [AuthorisedRoles.ROLE_RELEASE_DATES_CALCULATOR]
      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({ day: '28', month: '2', year: '2025' })
        .expect(302)
        .expect('Location', '/authError')
    })
  })
})

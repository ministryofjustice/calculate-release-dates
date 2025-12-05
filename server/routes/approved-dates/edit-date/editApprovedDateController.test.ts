import { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { v4 as uuidv4 } from 'uuid'
import { appWithAllRoutes, flashProvider } from '../../testutils/appSetup'
import SessionSetup from '../../testutils/sessionSetup'
import PrisonerService from '../../../services/prisonerService'
import { PrisonApiPrisoner } from '../../../@types/prisonApi/prisonClientTypes'
import DateTypeConfigurationService from '../../../services/dateTypeConfigurationService'
import { testDateTypeToDescriptions } from '../../../testutils/createUserToken'
import { ApprovedDatesJourney } from '../../../@types/journeys'

jest.mock('../../../services/dateTypeConfigurationService')
jest.mock('../../../services/prisonerService')

describe('EditApprovedDateController', () => {
  let app: Express
  const sessionSetup = new SessionSetup()

  const dateTypeConfigurationService = new DateTypeConfigurationService() as jest.Mocked<DateTypeConfigurationService>
  const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>

  let journey: ApprovedDatesJourney
  const prisonerNumber = 'A1234BC'
  const calculationRequestId = 465987
  const journeyId = uuidv4()
  const stubbedPrisonerData = {
    offenderNo: prisonerNumber,
    firstName: 'Anon',
    lastName: 'Nobody',
  } as PrisonApiPrisoner
  const pageUrl = `/approved-dates/${prisonerNumber}/HDCAD/edit/${journeyId}`

  beforeEach(() => {
    journey = {
      id: journeyId,
      preliminaryCalculationRequestId: calculationRequestId,
      nomsId: prisonerNumber,
      lastTouched: new Date().toISOString(),
      datesToSave: [],
      datesBeingAdded: [],
    }
    sessionSetup.sessionDoctor = req => {
      req.session.approvedDatesJourneys = {}
      req.session.approvedDatesJourneys[journeyId] = journey
    }
    app = appWithAllRoutes({
      services: {
        dateTypeConfigurationService,
        prisonerService,
      },
      sessionSetup,
    })
    dateTypeConfigurationService.dateTypeToDescriptionMapping.mockResolvedValue(testDateTypeToDescriptions)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should load page and render correct navigation', async () => {
      journey.datesToSave = [
        { type: 'APD', date: '2025-06-15' },
        { type: 'HDCAD', date: '2015-12-25' },
      ]

      const response = await request(app).get(pageUrl)

      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      expect($('[data-qa=back-link]').attr('href')).toStrictEqual(
        `/approved-dates/${prisonerNumber}/review-approved-dates/${journeyId}`,
      )
      expect($('[data-qa=cancel-link]').attr('href')).toStrictEqual(
        `/calculation/${prisonerNumber}/cancelCalculation?redirectUrl=${pageUrl}`,
      )
    })

    it('should return to review dates if this date is not in the session to be added, e.g., using browser back or typing a URL', async () => {
      journey.datesToSave = [{ type: 'APD', date: '2025-06-15' }]

      await request(app)
        .get(pageUrl)
        .expect(302)
        .expect('Location', `/approved-dates/${prisonerNumber}/review-approved-dates/${journeyId}`)
    })

    it('should show values from user if there was a validation error', async () => {
      journey.datesToSave = [{ type: 'HDCAD', date: '2015-12-25' }]
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
      journey.datesToSave = [{ type: 'HDCAD', date: '2015-12-25' }]

      const response = await request(app).get(pageUrl)

      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      expect($('#day').val()).toStrictEqual('FOO')
      expect($('#month').val()).toStrictEqual('10')
      expect($('#year').val()).toStrictEqual('2000')
    })

    it('should use existing value in the session if there is no validation error', async () => {
      journey.datesToSave = [{ type: 'HDCAD', date: '2015-12-25' }]

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
      const originalHdced = { type: 'HDCAD', date: '2010-10-11' }
      journey.datesToSave = [originalHdced]

      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({ day: '30', month: '2', year: '2025' })
        .expect(302)
        .expect('Location', `${pageUrl}#`)

      expect(journey).toStrictEqual({
        id: journeyId,
        preliminaryCalculationRequestId: calculationRequestId,
        nomsId: prisonerNumber,
        lastTouched: expect.anything(),
        datesToSave: [originalHdced],
        datesBeingAdded: [],
      })
    })

    it('should return the review page with updated dates if valid ', async () => {
      journey.datesToSave = [{ type: 'HDCAD', date: '2010-10-11' }]

      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({ day: '28', month: '2', year: '2025' })
        .expect(302)
        .expect('Location', `/approved-dates/${prisonerNumber}/review-approved-dates/${journeyId}`)

      expect(journey).toStrictEqual({
        id: journeyId,
        preliminaryCalculationRequestId: calculationRequestId,
        nomsId: prisonerNumber,
        lastTouched: expect.anything(),
        datesToSave: [{ type: 'HDCAD', date: '2025-02-28' }],
        datesBeingAdded: [],
      })
    })
  })
})

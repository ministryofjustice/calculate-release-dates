import { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { v4 as uuidv4 } from 'uuid'
import { appWithAllRoutes } from '../../testutils/appSetup'
import SessionSetup from '../../testutils/sessionSetup'
import PrisonerService from '../../../services/prisonerService'
import { PrisonApiPrisoner } from '../../../@types/prisonApi/prisonClientTypes'
import DateTypeConfigurationService from '../../../services/dateTypeConfigurationService'
import { testDateTypeToDescriptions } from '../../../testutils/createUserToken'
import { ApprovedDatesJourney } from '../../../@types/journeys'

jest.mock('../../../services/dateTypeConfigurationService')
jest.mock('../../../services/prisonerService')

describe('DeleteApprovedDateController', () => {
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
  const pageUrl = `/approved-dates/${prisonerNumber}/HDCAD/delete/${journeyId}`

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
      // no back link as NO takes you back to the interstitial page anyway
      expect($('[data-qa=back-link]')).toHaveLength(0)
      expect($('[data-qa=cancel-link]').attr('href')).toStrictEqual(
        `/calculation/${prisonerNumber}/cancelCalculation?redirectUrl=${pageUrl}`,
      )
      expect($('.delete-date-heading').eq(0).text().trim()) //
        .toStrictEqual('Are you sure you want to delete Home detention curfew approved date?')
    })

    it('should return to review dates if this date is not in the session to be added, e.g., using browser back or typing a URL', async () => {
      journey.datesToSave = [{ type: 'APD', date: '2025-06-15' }]

      await request(app)
        .get(pageUrl)
        .expect(302)
        .expect('Location', `/approved-dates/${prisonerNumber}/review-approved-dates/${journeyId}`)
    })
  })

  describe('POST', () => {
    it('should return to input page without removing the date if there were errors ', async () => {
      const originalHdced = { type: 'HDCAD', date: '2010-10-11' }
      journey.datesToSave = [originalHdced]

      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({})
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

    it('should delete the date and return the review page if YES was selected ', async () => {
      journey.datesToSave = [
        { type: 'APD', date: '2011-11-12' },
        { type: 'HDCAD', date: '2010-10-11' },
        { type: 'ROTL', date: '2025-09-15' },
      ]

      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({ confirmDeleteDate: 'YES' })
        .expect(302)
        .expect('Location', `/approved-dates/${prisonerNumber}/review-approved-dates/${journeyId}`)

      expect(journey).toStrictEqual({
        id: journeyId,
        preliminaryCalculationRequestId: calculationRequestId,
        nomsId: prisonerNumber,
        lastTouched: expect.anything(),
        datesToSave: [
          { type: 'APD', date: '2011-11-12' },
          { type: 'ROTL', date: '2025-09-15' },
        ],
        datesBeingAdded: [],
      })
    })

    it('should return to the review page without deleting dates if NO was selected ', async () => {
      journey.datesToSave = [
        { type: 'APD', date: '2011-11-12' },
        { type: 'HDCAD', date: '2010-10-11' },
        { type: 'ROTL', date: '2025-09-15' },
      ]

      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({ confirmDeleteDate: 'NO' })
        .expect(302)
        .expect('Location', `/approved-dates/${prisonerNumber}/review-approved-dates/${journeyId}`)

      expect(journey).toStrictEqual({
        id: journeyId,
        preliminaryCalculationRequestId: calculationRequestId,
        nomsId: prisonerNumber,
        lastTouched: expect.anything(),
        datesToSave: [
          { type: 'APD', date: '2011-11-12' },
          { type: 'HDCAD', date: '2010-10-11' },
          { type: 'ROTL', date: '2025-09-15' },
        ],
        datesBeingAdded: [],
      })
    })
  })
})

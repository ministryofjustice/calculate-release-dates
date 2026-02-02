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
import CalculateReleaseDatesService from '../../../services/calculateReleaseDatesService'
import { ApprovedDatesJourney } from '../../../@types/journeys'

jest.mock('../../../services/prisonerService')
jest.mock('../../../services/dateTypeConfigurationService')
jest.mock('../../../services/calculateReleaseDatesService')

describe('SelectApprovedDatesController', () => {
  let app: Express
  const sessionSetup = new SessionSetup()

  const prisonerService = new PrisonerService(null, null) as jest.Mocked<PrisonerService>
  const dateTypeConfigurationService = new DateTypeConfigurationService(
    null,
  ) as jest.Mocked<DateTypeConfigurationService>
  const calculateReleaseDatesService = new CalculateReleaseDatesService(
    null,
    null,
  ) as jest.Mocked<CalculateReleaseDatesService>

  let journey: ApprovedDatesJourney
  const prisonerNumber = 'A1234BC'
  const calculationRequestId = 465987
  const journeyId = uuidv4()
  const stubbedPrisonerData = {
    offenderNo: prisonerNumber,
    firstName: 'Anon',
    lastName: 'Nobody',
  } as PrisonApiPrisoner
  const pageUrl = `/approved-dates/${prisonerNumber}/select-dates/${journeyId}`

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
        prisonerService,
        dateTypeConfigurationService,
        calculateReleaseDatesService,
      },
      sessionSetup,
    })
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    dateTypeConfigurationService.dateTypeToDescriptionMapping.mockResolvedValue(testDateTypeToDescriptions)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should load page and render correct navigation when there were previously entered approved dates', async () => {
      journey.datesToSave = [{ type: 'APD', date: '2021-10-03' }]
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

    it('should load page and render correct navigation when there were no previously entered approved dates', async () => {
      journey.datesToSave = []
      const response = await request(app).get(pageUrl)

      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      expect($('[data-qa=back-link]').attr('href')).toStrictEqual(
        `/approved-dates/${prisonerNumber}/review-calculated-dates/${journeyId}`,
      )
      expect($('[data-qa=cancel-link]').attr('href')).toStrictEqual(
        `/calculation/${prisonerNumber}/cancelCalculation?redirectUrl=${pageUrl}`,
      )
    })

    it('should show list of dates with the ones already added being disabled ', async () => {
      journey.datesToSave = [{ type: 'APD', date: '2025-01-02' }]

      const response = await request(app).get(pageUrl)

      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      const apdRadio = $(`[data-qa=checkbox-APD]`)
      expect(apdRadio.attr('checked')).toStrictEqual('checked')
      expect(apdRadio.attr('disabled')).toStrictEqual('disabled')
      const hdcadRadio = $(`[data-qa=checkbox-HDCAD]`)
      expect(hdcadRadio.attr('checked')).toBeUndefined()
      expect(hdcadRadio.attr('disabled')).toBeUndefined()
      const rotlRadio = $(`[data-qa=checkbox-ROTL]`)
      expect(rotlRadio.attr('checked')).toBeUndefined()
      expect(rotlRadio.attr('disabled')).toBeUndefined()
    })

    it('should show list of dates with the ones already added being disabled and pending ones just ticked but not disabled', async () => {
      journey.datesToSave = [{ type: 'APD', date: '2021-02-03' }]
      journey.datesBeingAdded = [{ type: 'ROTL' }]
      const response = await request(app).get(pageUrl)
      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      const apdRadio = $(`[data-qa=checkbox-APD]`)
      expect(apdRadio.attr('checked')).toStrictEqual('checked')
      expect(apdRadio.attr('disabled')).toStrictEqual('disabled')
      const rotlRadio = $(`[data-qa=checkbox-ROTL]`)
      expect(rotlRadio.attr('checked')).toStrictEqual('checked')
      expect(rotlRadio.attr('disabled')).toBeUndefined()
    })
  })

  describe('POST', () => {
    it('should return to review dates if no date types at all were selected', async () => {
      journey.datesToSave = [{ type: 'APD', date: '2025-01-02' }]
      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({})
        .expect(302)
        .expect('Location', `/approved-dates/${prisonerNumber}/review-approved-dates/${journeyId}`)

      // should not have set anything on inputs
      expect(journey).toStrictEqual({
        id: journeyId,
        preliminaryCalculationRequestId: calculationRequestId,
        nomsId: prisonerNumber,
        lastTouched: expect.anything(),
        datesToSave: [{ type: 'APD', date: '2025-01-02' }],
        datesBeingAdded: [],
      })
    })

    it('should return to review dates if no new date types were selected', async () => {
      journey.datesToSave = [{ type: 'APD', date: '2025-01-02' }]

      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({ dateType: ['APD'] })
        .expect(302)
        .expect('Location', `/approved-dates/${prisonerNumber}/review-approved-dates/${journeyId}`)

      // should not have set anything on inputs
      expect(journey).toStrictEqual({
        id: journeyId,
        preliminaryCalculationRequestId: calculationRequestId,
        nomsId: prisonerNumber,
        lastTouched: expect.anything(),
        datesToSave: [{ type: 'APD', date: '2025-01-02' }],
        datesBeingAdded: [],
      })
    })

    it('should go to the first selected date page and persist adding dates to the inputs', async () => {
      journey.datesToSave = [{ type: 'APD', date: '2025-01-02' }]

      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({ dateType: ['HDCAD', 'ROTL'] })
        .expect(302)
        .expect('Location', `/approved-dates/${prisonerNumber}/HDCAD/add/${journeyId}`)

      expect(journey).toStrictEqual({
        id: journeyId,
        preliminaryCalculationRequestId: calculationRequestId,
        nomsId: prisonerNumber,
        lastTouched: expect.anything(),
        datesToSave: [{ type: 'APD', date: '2025-01-02' }],
        datesBeingAdded: [{ type: 'HDCAD' }, { type: 'ROTL' }],
      })
    })

    it('should handle only one date being added', async () => {
      journey.datesToSave = [{ type: 'APD', date: '2025-01-02' }]
      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({ dateType: 'HDCAD' })
        .expect(302)
        .expect('Location', `/approved-dates/${prisonerNumber}/HDCAD/add/${journeyId}`)

      expect(journey).toStrictEqual({
        id: journeyId,
        preliminaryCalculationRequestId: calculationRequestId,
        nomsId: prisonerNumber,
        lastTouched: expect.anything(),
        datesToSave: [{ type: 'APD', date: '2025-01-02' }],
        datesBeingAdded: [{ type: 'HDCAD' }],
      })
    })
  })
})

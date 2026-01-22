import { v4 as uuidv4 } from 'uuid'
import { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { HttpError } from 'http-errors'
import CalculateReleaseDatesService from '../../../services/calculateReleaseDatesService'
import { appWithAllRoutes, flashProvider } from '../../testutils/appSetup'
import SessionSetup from '../../testutils/sessionSetup'
import PrisonerService from '../../../services/prisonerService'
import { PrisonApiPrisoner } from '../../../@types/prisonApi/prisonClientTypes'
import DateTypeConfigurationService from '../../../services/dateTypeConfigurationService'
import { testDateTypeToDescriptions } from '../../../testutils/createUserToken'
import { ApprovedDatesJourney } from '../../../@types/journeys'

jest.mock('../../../services/calculateReleaseDatesService')
jest.mock('../../../services/prisonerService')
jest.mock('../../../services/dateTypeConfigurationService')

describe('ReviewApprovedDatesController', () => {
  let app: Express
  const sessionSetup = new SessionSetup()

  const calculateReleaseDatesService = new CalculateReleaseDatesService(
    null,
    null,
  ) as jest.Mocked<CalculateReleaseDatesService>
  const prisonerService = new PrisonerService(null, null) as jest.Mocked<PrisonerService>
  const dateTypeConfigurationService = new DateTypeConfigurationService() as jest.Mocked<DateTypeConfigurationService>

  let journey: ApprovedDatesJourney
  const prisonerNumber = 'A1234BC'
  const calculationRequestId = 465987
  const journeyId = uuidv4()
  const stubbedPrisonerData = {
    offenderNo: prisonerNumber,
    firstName: 'Anon',
    lastName: 'Nobody',
  } as PrisonApiPrisoner

  const pageUrl = `/approved-dates/${prisonerNumber}/review-approved-dates/${journeyId}`

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
        calculateReleaseDatesService,
        prisonerService,
        dateTypeConfigurationService,
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
    it('should load page and render correct navigation when not all dates added', async () => {
      journey.datesToSave = [{ type: 'APD', date: '2021-02-04' }]

      const response = await request(app).get(pageUrl)

      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      expect($('[data-qa=back-link]').attr('href')).toStrictEqual(
        `/approved-dates/${prisonerNumber}/review-calculated-dates/${journeyId}`,
      )
      expect($('[data-qa=cancel-link]').attr('href')).toStrictEqual(
        `/calculation/${prisonerNumber}/cancelCalculation?redirectUrl=${pageUrl}`,
      )
      expect($('[data-qa=add-dates-link]').attr('href')).toStrictEqual(
        `/approved-dates/${prisonerNumber}/select-dates/${journeyId}`,
      )
    })

    it('if all dates are present then hide the add link', async () => {
      journey.datesToSave = [
        { type: 'APD', date: '2021-02-04' },
        { type: 'HDCAD', date: '2021-02-03' },
        { type: 'ROTL', date: '2021-02-03' },
      ]

      const response = await request(app).get(pageUrl)

      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      expect($('[data-qa=back-link]').attr('href')).toStrictEqual(
        `/approved-dates/${prisonerNumber}/review-calculated-dates/${journeyId}`,
      )
      expect($('[data-qa=cancel-link]').attr('href')).toStrictEqual(
        `/calculation/${prisonerNumber}/cancelCalculation?redirectUrl=${pageUrl}`,
      )
      expect($('[data-qa=add-dates-link]')).toHaveLength(0)
    })

    it('should load dates from session and display in the correct order', async () => {
      journey.datesToSave = [
        { type: 'APD', date: '2021-10-03' },
        { type: 'HDCAD', date: '2021-02-04' },
        { type: 'ROTL', date: '2020-02-03' },
      ]
      const response = await request(app).get(pageUrl)

      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      const headings = $('dt')
      expect(headings).toHaveLength(3)
      expect(headings.eq(0).html().trim()).toStrictEqual(
        '<span class="govuk-!-font-size-24">ROTL</span><br><span class="govuk-hint">Release on temporary licence</span>',
      )
      expect(headings.eq(1).html().trim()).toStrictEqual(
        '<span class="govuk-!-font-size-24">HDCAD</span><br><span class="govuk-hint">Home detention curfew approved date</span>',
      )
      expect(headings.eq(2).html().trim()).toStrictEqual(
        '<span class="govuk-!-font-size-24">APD</span><br><span class="govuk-hint">Approved parole date</span>',
      )

      const rotlHeading = $('dt:contains("ROTL")')
      expect(rotlHeading.next().html().trim()).toStrictEqual('03 February 2020')
      const sedLinks = rotlHeading.next().next().find('a')
      expect(sedLinks.eq(0).text()).toStrictEqual('Edit')
      expect(sedLinks.eq(0).attr('href')).toStrictEqual(`/approved-dates/${prisonerNumber}/ROTL/edit/${journeyId}`)
      expect(sedLinks.eq(1).text()).toStrictEqual('Delete')
      expect(sedLinks.eq(1).attr('href')).toStrictEqual(`/approved-dates/${prisonerNumber}/ROTL/delete/${journeyId}`)

      const hdcadHeading = $('dt:contains("HDCAD")')
      expect(hdcadHeading.next().text().trim()).toStrictEqual('04 February 2021')
      const hdcadLinks = hdcadHeading.next().next().find('a')
      expect(hdcadLinks.eq(0).text()).toStrictEqual('Edit')
      expect(hdcadLinks.eq(0).attr('href')).toStrictEqual(`/approved-dates/${prisonerNumber}/HDCAD/edit/${journeyId}`)
      expect(hdcadLinks.eq(1).text()).toStrictEqual('Delete')
      expect(hdcadLinks.eq(1).attr('href')).toStrictEqual(`/approved-dates/${prisonerNumber}/HDCAD/delete/${journeyId}`)

      const apdHeading = $('dt:contains("APD")')
      expect(apdHeading.next().text().trim()).toStrictEqual('03 October 2021')
      const apdLinks = apdHeading.next().next().find('a')
      expect(apdLinks.eq(0).text()).toStrictEqual('Edit')
      expect(apdLinks.eq(0).attr('href')).toStrictEqual(`/approved-dates/${prisonerNumber}/APD/edit/${journeyId}`)
      expect(apdLinks.eq(1).text()).toStrictEqual('Delete')
      expect(apdLinks.eq(1).attr('href')).toStrictEqual(`/approved-dates/${prisonerNumber}/APD/delete/${journeyId}`)
    })

    it('should show no dates selected warning if all the dates are removed', async () => {
      journey.datesToSave = []

      const response = await request(app).get(pageUrl)

      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      expect($('[data-qa=no-dates-warning]').text().trim()).toStrictEqual(
        'No APD, HDCAD or ROTL dates have been added.',
      )
      expect($('[data-qa=back-link]').attr('href')).toStrictEqual(
        `/approved-dates/${prisonerNumber}/select-dates/${journeyId}`,
      )
    })
  })

  describe('POST', () => {
    it('should confirm the calculation with the approved dates', async () => {
      const newCalculationRequestId = 2468972456
      calculateReleaseDatesService.confirmCalculation.mockResolvedValue({
        dates: {},
        calculationRequestId: newCalculationRequestId,
        effectiveSentenceLength: null,
        prisonerId: 'A1234AA',
        calculationReference: 'ABC123',
        bookingId: 123,
        calculationStatus: 'PRELIMINARY',
        calculationType: 'CALCULATED',
      })
      journey.datesToSave = [
        { type: 'ROTL', date: '2021-10-03' },
        { type: 'HDCAD', date: '2021-02-04' },
        { type: 'APD', date: '2021-02-03' },
      ]

      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({})
        .expect(302)
        .expect('Location', `/calculation/${prisonerNumber}/complete/${newCalculationRequestId}`)

      expect(calculateReleaseDatesService.confirmCalculation).toHaveBeenCalledWith(
        'user1',
        prisonerNumber,
        calculationRequestId,
        'token',
        expect.objectContaining({
          calculationFragments: expect.anything(),
          approvedDates: [
            { dateType: 'ROTL', date: { day: 3, month: 10, year: 2021 } },
            { dateType: 'HDCAD', date: { day: 4, month: 2, year: 2021 } },
            { dateType: 'APD', date: { day: 3, month: 2, year: 2021 } },
          ],
        }),
      )
    })

    it('should redirect to input with errors if confirming calc with approved dates was not successful', async () => {
      const error = {
        status: 412,
        message: 'An error has occurred',
      } as HttpError

      calculateReleaseDatesService.confirmCalculation.mockImplementation(() => {
        throw error
      })
      journey.datesToSave = [
        { type: 'APD', date: '2021-02-03' },
        { type: 'HDCAD', date: '2021-02-04' },
      ]

      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({})
        .expect(302)
        .expect('Location', `${pageUrl}#`)

      expect(flashProvider).toHaveBeenCalledWith(
        'validationErrors',
        JSON.stringify({ datesToSave: ['Adding approved dates failed'] }),
      )
    })
  })
})

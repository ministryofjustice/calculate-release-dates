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
  ) as jest.Mocked<CalculateReleaseDatesService>
  const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
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
    it('should load page and render correct navigation for standard journey', async () => {
      journey.datesToSave = [
        { type: 'CRD', date: '2021-02-04' },
        { type: 'SED', date: '2021-02-03' },
        { type: 'LED', date: '2021-02-03' },
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
    })

    it('should load dates from session and display in the correct order', async () => {
      journey.datesToSave = [
        { type: 'HDCED', date: '2021-10-03' },
        { type: 'CRD', date: '2021-02-04' },
        { type: 'ERSED', date: '2020-02-03' },
        { type: 'SED', date: '2021-02-03' },
      ]
      const response = await request(app).get(pageUrl)

      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      const headings = $('dt')
      expect(headings).toHaveLength(4)
      expect(headings.eq(0).html().trim()).toStrictEqual(
        '<span class="govuk-!-font-size-24">SED</span><br><span class="govuk-hint">Sentence expiry date</span>',
      )
      expect(headings.eq(1).html().trim()).toStrictEqual(
        '<span class="govuk-!-font-size-24">CRD</span><br><span class="govuk-hint">Conditional release date</span>',
      )
      expect(headings.eq(2).html().trim()).toStrictEqual(
        '<span class="govuk-!-font-size-24">HDCED</span><br><span class="govuk-hint">Home detention curfew eligibility date</span>',
      )
      expect(headings.eq(3).html().trim()).toStrictEqual(
        '<span class="govuk-!-font-size-24">ERSED</span><br><span class="govuk-hint">Early removal scheme eligibility date</span>',
      )

      const sedHeading = $('dt:contains("SED")')
      expect(sedHeading.next().html().trim()).toStrictEqual('03 February 2021')
      const sedLinks = sedHeading.next().next().find('a')
      expect(sedLinks.eq(0).text()).toStrictEqual('Edit')
      expect(sedLinks.eq(0).attr('href')).toStrictEqual(`/approved-dates/${prisonerNumber}/SED/edit/${journeyId}`)
      expect(sedLinks.eq(1).text()).toStrictEqual('Delete')
      expect(sedLinks.eq(1).attr('href')).toStrictEqual(`/approved-dates/${prisonerNumber}/SED/delete/${journeyId}`)

      const crdHeading = $('dt:contains("CRD")')
      expect(crdHeading.next().text().trim()).toStrictEqual('04 February 2021')
      const crdLinks = crdHeading.next().next().find('a')
      expect(crdLinks.eq(0).text()).toStrictEqual('Edit')
      expect(crdLinks.eq(0).attr('href')).toStrictEqual(`/approved-dates/${prisonerNumber}/CRD/edit/${journeyId}`)
      expect(crdLinks.eq(1).text()).toStrictEqual('Delete')
      expect(crdLinks.eq(1).attr('href')).toStrictEqual(`/approved-dates/${prisonerNumber}/CRD/delete/${journeyId}`)

      const hdcedHeading = $('dt:contains("HDCED")')
      expect(hdcedHeading.next().text().trim()).toStrictEqual('03 October 2021')
      const hdcedLinks = hdcedHeading.next().next().find('a')
      expect(hdcedLinks.eq(0).text()).toStrictEqual('Edit')
      expect(hdcedLinks.eq(0).attr('href')).toStrictEqual(`/approved-dates/${prisonerNumber}/HDCED/edit/${journeyId}`)
      expect(hdcedLinks.eq(1).text()).toStrictEqual('Delete')
      expect(hdcedLinks.eq(1).attr('href')).toStrictEqual(`/approved-dates/${prisonerNumber}/HDCED/delete/${journeyId}`)

      const ersedHeading = $('dt:contains("ERSED")')
      expect(ersedHeading.next().text().trim()).toStrictEqual('03 February 2020')
      const ersedLinks = ersedHeading.next().next().find('a')
      expect(ersedLinks.eq(0).text()).toStrictEqual('Edit')
      expect(ersedLinks.eq(0).attr('href')).toStrictEqual(`/approved-dates/${prisonerNumber}/ERSED/edit/${journeyId}`)
      expect(ersedLinks.eq(1).text()).toStrictEqual('Delete')
      expect(ersedLinks.eq(1).attr('href')).toStrictEqual(`/approved-dates/${prisonerNumber}/ERSED/delete/${journeyId}`)
    })

    it('should redirect to select dates screen if all dates have been removed', async () => {
      journey.datesToSave = []

      await request(app)
        .get(pageUrl)
        .expect(302)
        .expect('Location', `/approved-dates/${prisonerNumber}/select-dates/${journeyId}`)
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
        { type: 'SED', date: '2021-02-03' },
        { type: 'CRD', date: '2021-02-04' },
        { type: 'HDCED', date: '2021-10-03' },
        { type: 'ERSED', date: '2020-02-03' },
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
            { dateType: 'SED', date: { day: 3, month: 2, year: 2021 } },
            { dateType: 'CRD', date: { day: 4, month: 2, year: 2021 } },
            { dateType: 'HDCED', date: { day: 3, month: 10, year: 2021 } },
            { dateType: 'ERSED', date: { day: 3, month: 2, year: 2020 } },
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
        { type: 'SED', date: '2021-02-03' },
        { type: 'CRD', date: '2021-02-04' },
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

import { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import CalculateReleaseDatesService from '../../../services/calculateReleaseDatesService'
import { appWithAllRoutes } from '../../testutils/appSetup'
import SessionSetup from '../../testutils/sessionSetup'
import { GenuineOverrideInputs } from '../../../models/genuine-override/genuineOverrideInputs'
import PrisonerService from '../../../services/prisonerService'
import { PrisonApiPrisoner } from '../../../@types/prisonApi/prisonClientTypes'
import DateTypeConfigurationService from '../../../services/dateTypeConfigurationService'
import { BookingCalculation } from '../../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

jest.mock('../../../services/calculateReleaseDatesService')
jest.mock('../../../services/prisonerService')
jest.mock('../../../services/dateTypeConfigurationService')

describe('ReviewDatesForGenuineOverrideController', () => {
  let app: Express
  const sessionSetup = new SessionSetup()

  const calculateReleaseDatesService = new CalculateReleaseDatesService(
    null,
  ) as jest.Mocked<CalculateReleaseDatesService>
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
  const pageUrl = `/calculation/${prisonerNumber}/review-dates-for-override/${calculationRequestId}`

  const mockDateConfigs = {
    CRD: 'Conditional release date',
    LED: 'Licence expiry date',
    SED: 'Sentence expiry date',
    NPD: 'Non-parole date',
    ARD: 'Automatic release date',
    TUSED: 'Top up supervision expiry date',
    PED: 'Parole eligibility date',
    SLED: 'Sentence and licence expiry date',
    HDCED: 'Home detention curfew eligibility date',
    NCRD: 'Notional conditional release date',
    ETD: 'Early transfer date',
    MTD: 'Mid transfer date',
    LTD: 'Late transfer date',
    DPRRD: 'Detention and training order post recall release date',
    PRRD: 'Post recall release date',
    ESED: 'Effective sentence end date',
    ERSED: 'Early removal scheme eligibility date',
    TERSED: 'Tariff-expired removal scheme eligibility date',
    APD: 'Approved parole date',
    HDCAD: 'Home detention curfew approved date',
    None: 'None of the above dates apply',
    Tariff: 'known as the Tariff expiry date',
    ROTL: 'Release on temporary licence',
  }

  beforeEach(() => {
    genuineOverrideInputs = {}
    sessionSetup.sessionDoctor = req => {
      req.session.genuineOverrideInputs = {}
      req.session.genuineOverrideInputs[prisonerNumber] = genuineOverrideInputs
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
    dateTypeConfigurationService.dateTypeToDescriptionMapping.mockResolvedValue(mockDateConfigs)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should load page and render correct navigation', async () => {
      calculateReleaseDatesService.getCalculationResults.mockResolvedValue({
        dates: {
          CRD: '2021-02-03',
          SED: '2021-02-03',
        },
        calculationRequestId: 123456,
        effectiveSentenceLength: null,
        prisonerId: 'A1234AB',
        calculationStatus: 'CONFIRMED',
        calculationReference: 'ABC123',
        calculationType: 'CALCULATED',
        bookingId: 123,
        approvedDates: {},
      } as BookingCalculation)

      const response = await request(app).get(pageUrl)

      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      expect($('[data-qa=back-link]').attr('href')).toStrictEqual(
        `/calculation/${prisonerNumber}/select-reason-for-override/${calculationRequestId}`,
      )
      expect($('[data-qa=cancel-link]').attr('href')).toStrictEqual(
        `/calculation/${prisonerNumber}/cancelCalculation?redirectUrl=${pageUrl}`,
      )
    })

    it('should load dates from back end on initial load, in the correct order and excluding hidden types such as ESED', async () => {
      calculateReleaseDatesService.getCalculationResults.mockResolvedValue({
        dates: {
          HDCED: '2021-10-03',
          CRD: '2021-02-04',
          ERSED: '2020-02-03',
          SED: '2021-02-03',
          ESED: '2020-02-05',
        },
        calculationRequestId: 123456,
        effectiveSentenceLength: null,
        prisonerId: 'A1234AB',
        calculationStatus: 'CONFIRMED',
        calculationReference: 'ABC123',
        calculationType: 'CALCULATED',
        bookingId: 123,
        approvedDates: {},
      } as BookingCalculation)

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
      expect(sedLinks.eq(0).attr('href')).toStrictEqual(
        `/calculation/${prisonerNumber}/override/SED/edit/${calculationRequestId}`,
      )
      expect(sedLinks.eq(1).text()).toStrictEqual('Delete')
      expect(sedLinks.eq(1).attr('href')).toStrictEqual(
        `/calculation/${prisonerNumber}/override/SED/delete/${calculationRequestId}`,
      )

      const crdHeading = $('dt:contains("CRD")')
      expect(crdHeading.next().text().trim()).toStrictEqual('04 February 2021')
      const crdLinks = crdHeading.next().next().find('a')
      expect(crdLinks.eq(0).text()).toStrictEqual('Edit')
      expect(crdLinks.eq(0).attr('href')).toStrictEqual(
        `/calculation/${prisonerNumber}/override/CRD/edit/${calculationRequestId}`,
      )
      expect(crdLinks.eq(1).text()).toStrictEqual('Delete')
      expect(crdLinks.eq(1).attr('href')).toStrictEqual(
        `/calculation/${prisonerNumber}/override/CRD/delete/${calculationRequestId}`,
      )

      const hdcedHeading = $('dt:contains("HDCED")')
      expect(hdcedHeading.next().text().trim()).toStrictEqual('03 October 2021')
      const hdcedLinks = hdcedHeading.next().next().find('a')
      expect(hdcedLinks.eq(0).text()).toStrictEqual('Edit')
      expect(hdcedLinks.eq(0).attr('href')).toStrictEqual(
        `/calculation/${prisonerNumber}/override/HDCED/edit/${calculationRequestId}`,
      )
      expect(hdcedLinks.eq(1).text()).toStrictEqual('Delete')
      expect(hdcedLinks.eq(1).attr('href')).toStrictEqual(
        `/calculation/${prisonerNumber}/override/HDCED/delete/${calculationRequestId}`,
      )

      const ersedHeading = $('dt:contains("ERSED")')
      expect(ersedHeading.next().text().trim()).toStrictEqual('03 February 2020')
      const ersedLinks = ersedHeading.next().next().find('a')
      expect(ersedLinks.eq(0).text()).toStrictEqual('Edit')
      expect(ersedLinks.eq(0).attr('href')).toStrictEqual(
        `/calculation/${prisonerNumber}/override/ERSED/edit/${calculationRequestId}`,
      )
      expect(ersedLinks.eq(1).text()).toStrictEqual('Delete')
      expect(ersedLinks.eq(1).attr('href')).toStrictEqual(
        `/calculation/${prisonerNumber}/override/ERSED/delete/${calculationRequestId}`,
      )

      expect(calculateReleaseDatesService.getCalculationResults).toHaveBeenCalledTimes(1)
    })

    it('should decompose SLED into SED and LED', async () => {
      calculateReleaseDatesService.getCalculationResults.mockResolvedValue({
        dates: {
          SLED: '2021-10-03',
        },
        calculationRequestId: 123456,
        effectiveSentenceLength: null,
        prisonerId: 'A1234AB',
        calculationStatus: 'CONFIRMED',
        calculationReference: 'ABC123',
        calculationType: 'CALCULATED',
        bookingId: 123,
        approvedDates: {},
      } as BookingCalculation)

      const response = await request(app).get(pageUrl)

      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      const headings = $('dt')
      expect(headings).toHaveLength(2)
      expect(headings.eq(0).html().trim()).toStrictEqual(
        '<span class="govuk-!-font-size-24">LED</span><br><span class="govuk-hint">Licence expiry date</span>',
      )
      expect(headings.eq(1).html().trim()).toStrictEqual(
        '<span class="govuk-!-font-size-24">SED</span><br><span class="govuk-hint">Sentence expiry date</span>',
      )
      expect(calculateReleaseDatesService.getCalculationResults).toHaveBeenCalledTimes(1)
    })

    it('should load dates from session after initial load and maintain order', async () => {
      genuineOverrideInputs.datesToSave = [
        { type: 'SED', date: '2021-02-03' },
        { type: 'CRD', date: '2021-02-04' },
        { type: 'HDCED', date: '2021-10-03' },
        { type: 'ERSED', date: '2020-02-03' },
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

      expect(calculateReleaseDatesService.getCalculationResults).not.toHaveBeenCalled()
    })
  })
})

import { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import CalculateReleaseDatesService from '../../../services/calculateReleaseDatesService'
import { appWithAllRoutes, flashProvider, user } from '../../testutils/appSetup'
import SessionSetup from '../../testutils/sessionSetup'
import PrisonerService from '../../../services/prisonerService'
import { PrisonApiPrisoner } from '../../../@types/prisonApi/prisonClientTypes'
import DateTypeConfigurationService from '../../../services/dateTypeConfigurationService'
import AuthorisedRoles from '../../../enumerations/authorisedRoles'
import { testDateTypeToDescriptions } from '../../../testutils/createUserToken'
import { GenuineOverrideInputs } from '../../../@types/journeys'

jest.mock('../../../services/calculateReleaseDatesService')
jest.mock('../../../services/prisonerService')
jest.mock('../../../services/dateTypeConfigurationService')

describe('ReviewDatesForGenuineOverrideController', () => {
  let app: Express
  const sessionSetup = new SessionSetup()

  const calculateReleaseDatesService = new CalculateReleaseDatesService(
    null,
    null,
  ) as jest.Mocked<CalculateReleaseDatesService>
  const prisonerService = new PrisonerService(null, null) as jest.Mocked<PrisonerService>
  const dateTypeConfigurationService = new DateTypeConfigurationService(
    null,
  ) as jest.Mocked<DateTypeConfigurationService>

  let genuineOverrideInputs: GenuineOverrideInputs
  const prisonerNumber = 'A1234BC'
  const calculationRequestId = 465987
  const stubbedPrisonerData = {
    offenderNo: prisonerNumber,
    firstName: 'Anon',
    lastName: 'Nobody',
  } as PrisonApiPrisoner
  const pageUrl = `/calculation/${prisonerNumber}/review-dates-for-override/${calculationRequestId}`

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
        calculateReleaseDatesService,
        prisonerService,
        dateTypeConfigurationService,
      },
      sessionSetup,
      userSupplier: () => currentUser,
    })

    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    dateTypeConfigurationService.dateTypeToDescriptionMapping.mockResolvedValue(testDateTypeToDescriptions)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should load page and render correct navigation for standard journey', async () => {
      genuineOverrideInputs.datesToSave = [
        { type: 'CRD', date: '2021-02-04' },
        { type: 'SED', date: '2021-02-03' },
        { type: 'LED', date: '2021-02-03' },
      ]

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

    it('should load dates from session and display in the correct order', async () => {
      genuineOverrideInputs.datesToSave = [
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

      expect(genuineOverrideInputs).toStrictEqual({
        mode: 'STANDARD',
        datesToSave: [
          {
            date: '2021-02-03',
            type: 'SED',
          },
          {
            date: '2021-02-04',
            type: 'CRD',
          },
          {
            date: '2021-10-03',
            type: 'HDCED',
          },
          {
            date: '2020-02-03',
            type: 'ERSED',
          },
        ],
      })
    })

    it('should redirect to select dates screen if all dates have been removed', async () => {
      genuineOverrideInputs.datesToSave = []
      genuineOverrideInputs.mode = 'STANDARD'

      await request(app)
        .get(pageUrl)
        .expect(302)
        .expect('Location', `/calculation/${prisonerNumber}/override/select-dates/${calculationRequestId}`)
    })
  })

  describe('POST', () => {
    it('should create a genuine override and redirect to calculation complete if successful', async () => {
      const newCalculationRequestId = 2468972456
      calculateReleaseDatesService.createGenuineOverrideForCalculation.mockResolvedValue({
        success: true,
        newCalculationRequestId,
        originalCalculationRequestId: calculationRequestId,
      })
      genuineOverrideInputs.datesToSave = [
        { type: 'SED', date: '2021-02-03' },
        { type: 'CRD', date: '2021-02-04' },
        { type: 'HDCED', date: '2021-10-03' },
        { type: 'ERSED', date: '2020-02-03' },
      ]
      genuineOverrideInputs.mode = 'STANDARD'
      genuineOverrideInputs.reason = 'OTHER'
      genuineOverrideInputs.reasonFurtherDetail = 'Some more details'

      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({})
        .expect(302)
        .expect('Location', `/calculation/${prisonerNumber}/complete/${newCalculationRequestId}`)

      expect(calculateReleaseDatesService.createGenuineOverrideForCalculation).toHaveBeenCalledWith(
        'user1',
        prisonerNumber,
        Number(calculationRequestId),
        'token',
        {
          dates: [
            { dateType: 'SED', date: '2021-02-03' },
            { dateType: 'CRD', date: '2021-02-04' },
            { dateType: 'HDCED', date: '2021-10-03' },
            { dateType: 'ERSED', date: '2020-02-03' },
          ],
          reason: 'OTHER',
          reasonFurtherDetail: 'Some more details',
        },
      )
    })

    it('should redirect to input with errors if saving genuine override was not successful', async () => {
      calculateReleaseDatesService.createGenuineOverrideForCalculation.mockResolvedValue({
        success: false,
        validationMessages: [
          {
            code: 'DATES_MISSING_REQUIRED_TYPE',
            message: 'Error 1',
            type: 'VALIDATION',
            arguments: [],
            calculationUnsupported: false,
          },
          {
            code: 'DATES_PAIRINGS_INVALID',
            message: 'Error 2',
            type: 'VALIDATION',
            arguments: [],
            calculationUnsupported: false,
          },
        ],
      })
      genuineOverrideInputs.datesToSave = [
        { type: 'SED', date: '2021-02-03' },
        { type: 'CRD', date: '2021-02-04' },
      ]
      genuineOverrideInputs.mode = 'STANDARD'
      genuineOverrideInputs.reason = 'OTHER'
      genuineOverrideInputs.reasonFurtherDetail = 'Some more details'

      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({})
        .expect(302)
        .expect('Location', `/calculation/${prisonerNumber}/review-dates-for-override/${calculationRequestId}#`)

      expect(flashProvider).toHaveBeenCalledWith(
        'validationErrors',
        JSON.stringify({ datesToSave: ['Error 1', 'Error 2'] }),
      )
    })
  })
})

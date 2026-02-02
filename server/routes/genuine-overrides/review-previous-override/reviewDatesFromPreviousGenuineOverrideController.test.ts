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

describe('ReviewDatesFromPreviousGenuineOverrideController', () => {
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
  const pageUrl = `/calculation/${prisonerNumber}/review-dates-from-previous-override/${calculationRequestId}`

  let currentUser: Express.User
  beforeEach(() => {
    genuineOverrideInputs = {
      mode: 'EXPRESS',
      datesToSave: [],
      previousOverride: { calculationRequestId: 5456242132154, reason: 'A', dates: [] },
    }
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
    it('should render correct navigation', async () => {
      const response = await request(app).get(pageUrl)

      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      expect($('[data-qa=back-link]').attr('href')).toStrictEqual(
        `/calculation/${prisonerNumber}/express-override-intercept/${calculationRequestId}`,
      )
      expect($('[data-qa=cancel-link]').attr('href')).toStrictEqual(
        `/calculation/${prisonerNumber}/cancelCalculation?redirectUrl=${pageUrl}`,
      )
    })

    it('should show dates from previous override in correct order regardless of current dates to save', async () => {
      genuineOverrideInputs.datesToSave = [
        { type: 'HDCED', date: '2021-10-03' },
        { type: 'CRD', date: '2021-02-04' },
        { type: 'ERSED', date: '2020-02-03' },
        { type: 'SED', date: '2021-02-03' },
      ]
      genuineOverrideInputs.previousOverride.dates = [
        { type: 'HDCED', date: '2031-10-03' },
        { type: 'CRD', date: '2031-02-04' },
        { type: 'ERSED', date: '2030-02-03' },
        { type: 'SED', date: '2031-02-03' },
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
      expect(sedHeading.next().html().trim()).toStrictEqual('03 February 2031')

      const crdHeading = $('dt:contains("CRD")')
      expect(crdHeading.next().text().trim()).toStrictEqual('04 February 2031')

      const hdcedHeading = $('dt:contains("HDCED")')
      expect(hdcedHeading.next().text().trim()).toStrictEqual('03 October 2031')

      const ersedHeading = $('dt:contains("ERSED")')
      expect(ersedHeading.next().text().trim()).toStrictEqual('03 February 2030')
    })
  })

  describe('POST', () => {
    it('should redirect to input if no option is selected', async () => {
      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({})
        .expect(302)
        .expect('Location', `${pageUrl}#`)
    })

    it('should create a genuine override using previous override and redirect to calculation complete if they agree the dates are correct', async () => {
      const newCalculationRequestId = 2468972456
      calculateReleaseDatesService.createGenuineOverrideForCalculation.mockResolvedValue({
        success: true,
        newCalculationRequestId,
        originalCalculationRequestId: calculationRequestId,
      })
      // make sure we use previous and not anything in session for the current override in case they go back.
      genuineOverrideInputs.datesToSave = [
        { type: 'SED', date: '2021-02-03' },
        { type: 'CRD', date: '2021-02-04' },
        { type: 'HDCED', date: '2021-10-03' },
        { type: 'ERSED', date: '2020-02-03' },
      ]
      genuineOverrideInputs.reason = 'OTHER'
      genuineOverrideInputs.reasonFurtherDetail = 'Some further details'

      genuineOverrideInputs.previousOverride = {
        calculationRequestId: 455646548789,
        reason: 'A',
        reasonFurtherDetail: null,
        dates: [
          { type: 'SED', date: '2031-02-03' },
          { type: 'CRD', date: '2031-02-04' },
          { type: 'HDCED', date: '2031-10-03' },
          { type: 'ERSED', date: '2030-02-03' },
        ],
      }

      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({ stillCorrect: 'YES' })
        .expect(302)
        .expect('Location', `/calculation/${prisonerNumber}/complete/${newCalculationRequestId}`)

      expect(calculateReleaseDatesService.createGenuineOverrideForCalculation).toHaveBeenCalledWith(
        'user1',
        prisonerNumber,
        Number(calculationRequestId),
        'token',
        {
          dates: [
            { dateType: 'SED', date: '2031-02-03' },
            { dateType: 'CRD', date: '2031-02-04' },
            { dateType: 'HDCED', date: '2031-10-03' },
            { dateType: 'ERSED', date: '2030-02-03' },
          ],
          reason: 'A',
          reasonFurtherDetail: null,
        },
      )
    })

    it('should return validation errors saving the genuine override', async () => {
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
      genuineOverrideInputs.previousOverride = {
        calculationRequestId: 455646548789,
        reason: 'A',
        reasonFurtherDetail: null,
        dates: [
          { type: 'SED', date: '2031-02-03' },
          { type: 'CRD', date: '2031-02-04' },
        ],
      }

      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({ stillCorrect: 'YES' })
        .expect(302)
        .expect('Location', `${pageUrl}#`)

      expect(flashProvider).toHaveBeenCalledWith(
        'validationErrors',
        JSON.stringify({ datesToSave: ['Error 1', 'Error 2'] }),
      )
      expect(flashProvider).toHaveBeenCalledWith('formResponses', JSON.stringify({ stillCorrect: 'YES' }))
    })

    it('should continue to creating a new override if they select no', async () => {
      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({ stillCorrect: 'NO' })
        .expect(302)
        .expect('Location', `/calculation/${prisonerNumber}/select-reason-for-override/${calculationRequestId}`)

      expect(calculateReleaseDatesService.createGenuineOverrideForCalculation).not.toHaveBeenCalled()
    })
  })
})

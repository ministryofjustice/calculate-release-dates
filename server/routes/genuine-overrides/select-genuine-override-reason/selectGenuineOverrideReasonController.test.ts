import { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import CalculateReleaseDatesService from '../../../services/calculateReleaseDatesService'
import { appWithAllRoutes, flashProvider, user } from '../../testutils/appSetup'
import SessionSetup from '../../testutils/sessionSetup'
import PrisonerService from '../../../services/prisonerService'
import { PrisonApiPrisoner } from '../../../@types/prisonApi/prisonClientTypes'
import AuthorisedRoles from '../../../enumerations/authorisedRoles'
import { GenuineOverrideInputs } from '../../../@types/journeys'

jest.mock('../../../services/calculateReleaseDatesService')
jest.mock('../../../services/prisonerService')

describe('SelectGenuineOverrideReasonController', () => {
  let app: Express
  const sessionSetup = new SessionSetup()

  const calculateReleaseDatesService = new CalculateReleaseDatesService(
    null,
    null,
  ) as jest.Mocked<CalculateReleaseDatesService>
  const prisonerService = new PrisonerService(null, null) as jest.Mocked<PrisonerService>

  let genuineOverrideInputs: GenuineOverrideInputs
  const prisonerNumber = 'A1234BC'
  const calculationRequestId = 465987
  const stubbedPrisonerData = {
    offenderNo: prisonerNumber,
    firstName: 'Anon',
    lastName: 'Nobody',
  } as PrisonApiPrisoner
  const pageUrl = `/calculation/${prisonerNumber}/select-reason-for-override/${calculationRequestId}`
  let currentUser: Express.User

  beforeEach(() => {
    currentUser = {
      ...user,
      userRoles: [AuthorisedRoles.ROLE_RELEASE_DATES_CALCULATOR, AuthorisedRoles.ROLE_CRD__GENUINE_OVERRIDES__RW],
    }
    genuineOverrideInputs = { mode: 'STANDARD', datesToSave: [{ type: 'SED', date: '2011-01-02' }] }
    sessionSetup.sessionDoctor = req => {
      req.session.genuineOverrideInputs = {}
      req.session.genuineOverrideInputs[prisonerNumber] = genuineOverrideInputs
    }

    app = appWithAllRoutes({
      services: {
        calculateReleaseDatesService,
        prisonerService,
      },
      sessionSetup,
      userSupplier: () => currentUser,
    })
    calculateReleaseDatesService.getGenuineOverrideReasons.mockResolvedValue([
      { code: 'OTHER', description: 'Other', displayOrder: 1, requiresFurtherDetail: true },
      { code: 'A', description: 'A reason', displayOrder: 0, requiresFurtherDetail: false },
    ])
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should load page and render correct navigation for standard journey', async () => {
      genuineOverrideInputs.mode = 'STANDARD'
      const response = await request(app).get(pageUrl)

      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      expect($('[data-qa=back-link]').attr('href')).toStrictEqual(
        `/calculation/${prisonerNumber}/summary/${calculationRequestId}`,
      )
      expect($('[data-qa=cancel-link]').attr('href')).toStrictEqual(
        `/calculation/${prisonerNumber}/cancelCalculation?redirectUrl=${pageUrl}`,
      )
    })

    it('should load page and render correct navigation for express journey', async () => {
      genuineOverrideInputs.mode = 'EXPRESS'
      const response = await request(app).get(pageUrl)

      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      expect($('[data-qa=back-link]').attr('href')).toStrictEqual(
        `/calculation/${prisonerNumber}/review-dates-from-previous-override/${calculationRequestId}`,
      )
      expect($('[data-qa=cancel-link]').attr('href')).toStrictEqual(
        `/calculation/${prisonerNumber}/cancelCalculation?redirectUrl=${pageUrl}`,
      )
    })

    it('should render options in display order from back end', async () => {
      const response = await request(app).get(pageUrl)

      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      const radios = $('.govuk-radios__input')
      expect(radios.eq(0).next().text().trim()).toStrictEqual(`A reason`)
      expect(radios.eq(1).next().text().trim()).toStrictEqual(`Other`)
    })

    it('should select option if there was a validation error', async () => {
      const form = { reason: 'OTHER' }
      flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))

      const response = await request(app).get(pageUrl)

      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      expect($('input[type=radio]:checked').val()).toStrictEqual('OTHER')
    })

    it('should maintain option if there was a validation error even if there is an existing value in the session', async () => {
      const form = { reason: 'OTHER' }
      flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))
      genuineOverrideInputs.reason = 'A'

      const response = await request(app).get(pageUrl)

      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      expect($('input[type=radio]:checked').val()).toStrictEqual('OTHER')
    })

    it('should use existing value in the session if there is no validation error', async () => {
      genuineOverrideInputs.reason = 'A'

      const response = await request(app).get(pageUrl)

      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      expect($('input[type=radio]:checked').val()).toStrictEqual('A')
    })
  })

  describe('POST', () => {
    it('should return to input page with errors set if there was nothing selected', async () => {
      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({ reason: 'OTHER' })
        .expect(302)
        .expect('Location', `${pageUrl}#`)

      // should not have set anything on inputs
      expect(genuineOverrideInputs).toStrictEqual({
        mode: 'STANDARD',
        datesToSave: [{ type: 'SED', date: '2011-01-02' }],
      })
    })
    it('should pass to review dates page if a reason was selected correctly', async () => {
      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({ reason: 'OTHER', reasonFurtherDetail: 'Foo' })
        .expect(302)
        .expect('Location', `/calculation/${prisonerNumber}/review-dates-for-override/${calculationRequestId}`)

      expect(genuineOverrideInputs).toStrictEqual({
        mode: 'STANDARD',
        datesToSave: [{ type: 'SED', date: '2011-01-02' }],
        reason: 'OTHER',
        reasonFurtherDetail: 'Foo',
      })
    })

    it('should pass to holiday intercept page if a corresponding reason was selected correctly', async () => {
      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({ reason: 'RELEASE_DATE_ON_WEEKEND_OR_HOLIDAY' })
        .expect(302)
        .expect('Location', `/calculation/${prisonerNumber}/weekend-holiday-override-intercept/${calculationRequestId}`)
    })
  })
})

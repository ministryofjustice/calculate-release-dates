import { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import CalculateReleaseDatesService from '../../../services/calculateReleaseDatesService'
import { appWithAllRoutes, user } from '../../testutils/appSetup'
import SessionSetup from '../../testutils/sessionSetup'
import PrisonerService from '../../../services/prisonerService'
import { PrisonApiPrisoner } from '../../../@types/prisonApi/prisonClientTypes'
import AuthorisedRoles from '../../../enumerations/authorisedRoles'
import { GenuineOverrideInputs } from '../../../@types/journeys'

jest.mock('../../../services/calculateReleaseDatesService')
jest.mock('../../../services/prisonerService')

describe('GenuineOverrideExpressInterceptController', () => {
  let app: Express
  const sessionSetup = new SessionSetup()

  const calculateReleaseDatesService = new CalculateReleaseDatesService(
    null,
  ) as jest.Mocked<CalculateReleaseDatesService>
  const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>

  let genuineOverrideInputs: GenuineOverrideInputs
  const prisonerNumber = 'A1234BC'
  const calculationRequestId = 465987
  const stubbedPrisonerData = {
    offenderNo: prisonerNumber,
    firstName: 'Anon',
    lastName: 'Nobody',
  } as PrisonApiPrisoner
  const pageUrl = `/calculation/${prisonerNumber}/express-override-intercept/${calculationRequestId}`

  let currentUser: Express.User
  beforeEach(() => {
    genuineOverrideInputs = {
      mode: 'EXPRESS',
      datesToSave: [],
      previousOverride: {
        calculationRequestId: 46578123154,
        reason: 'A',
        reasonFurtherDetail: null,
        dates: [],
      },
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
      },
      sessionSetup,
      userSupplier: () => currentUser,
    })

    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getGenuineOverrideReasons.mockResolvedValue([
      { code: 'OTHER', description: 'Other', displayOrder: 1, requiresFurtherDetail: true },
      { code: 'A', description: 'A reason', displayOrder: 0, requiresFurtherDetail: false },
    ])
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should load page and render correct navigation', async () => {
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

    it('reason should be resolved from the code if it is not OTHER', async () => {
      genuineOverrideInputs.previousOverride.reason = 'A'
      genuineOverrideInputs.previousOverride.reasonFurtherDetail = null
      const response = await request(app).get(pageUrl)

      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      expect($('[data-qa=previous-reason]').text().trim()).toStrictEqual('A reason')
    })

    it('reason should be the further detail if it is OTHER', async () => {
      genuineOverrideInputs.previousOverride.reason = 'OTHER'
      genuineOverrideInputs.previousOverride.reasonFurtherDetail = 'Some further detail'
      const response = await request(app).get(pageUrl)

      expect(response.status).toEqual(200)
      const $ = cheerio.load(response.text)
      expect($('[data-qa=previous-reason]').text().trim()).toStrictEqual('Some further detail')
    })

    it('should redirect to auth error if the user does not have required role', async () => {
      currentUser.userRoles = [AuthorisedRoles.ROLE_RELEASE_DATES_CALCULATOR]
      await request(app).get(pageUrl).expect(302).expect('Location', '/authError')
    })
  })

  describe('POST', () => {
    it('should pass to review express dates page', async () => {
      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({})
        .expect(302)
        .expect(
          'Location',
          `/calculation/${prisonerNumber}/review-dates-from-previous-override/${calculationRequestId}`,
        )
    })

    it('should redirect to auth error if the user does not have required role', async () => {
      currentUser.userRoles = [AuthorisedRoles.ROLE_RELEASE_DATES_CALCULATOR]
      await request(app) //
        .post(pageUrl)
        .type('form')
        .send({})
        .expect(302)
        .expect('Location', '/authError')
    })
  })
})

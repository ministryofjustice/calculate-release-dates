import { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../testutils/appSetup'
import SessionSetup from '../../testutils/sessionSetup'
import PrisonerService from '../../../services/prisonerService'
import { PrisonApiPrisoner } from '../../../@types/prisonApi/prisonClientTypes'
import AuthorisedRoles from '../../../enumerations/authorisedRoles'
import { GenuineOverrideInputs } from '../../../@types/journeys'

jest.mock('../../../services/prisonerService')

describe('GenuineOverrideHolidayInterceptController', () => {
  let app: Express
  const sessionSetup = new SessionSetup()

  const prisonerService = new PrisonerService(null, null) as jest.Mocked<PrisonerService>

  let genuineOverrideInputs: GenuineOverrideInputs
  const prisonerNumber = 'A1234BC'
  const calculationRequestId = 465987
  const stubbedPrisonerData = {
    offenderNo: prisonerNumber,
    firstName: 'Anon',
    lastName: 'Nobody',
  } as PrisonApiPrisoner
  const pageUrl = `/calculation/${prisonerNumber}/weekend-holiday-override-intercept/${calculationRequestId}`

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
        prisonerService,
      },
      sessionSetup,
      userSupplier: () => currentUser,
    })

    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
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
        `/calculation/${prisonerNumber}/select-reason-for-override/${calculationRequestId}`,
      )
      expect($('[data-qa=continue]').attr('href')).toStrictEqual(
        `/calculation/${prisonerNumber}/summary/${calculationRequestId}`,
      )
      expect($('[data-qa=cancel-link]').attr('href')).toStrictEqual(
        `/calculation/${prisonerNumber}/cancelCalculation?redirectUrl=${pageUrl}`,
      )
    })
  })
})

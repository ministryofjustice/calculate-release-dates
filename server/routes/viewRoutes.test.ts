import request from 'supertest'
import type { Express } from 'express'
import { appWithAllRoutes } from './testutils/appSetup'
import PrisonerService from '../services/prisonerService'
import UserService from '../services/userService'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import ViewReleaseDatesService from '../services/viewReleaseDatesService'
import config from '../config'
import { FullPageError } from '../types/FullPageError'
import AuditService from '../services/auditService'

jest.mock('../services/userService')
jest.mock('../services/calculateReleaseDatesService')
jest.mock('../services/prisonerService')
jest.mock('../services/viewReleaseDatesService')
jest.mock('../services/auditService')

const prisonerService = new PrisonerService(null, null) as jest.Mocked<PrisonerService>
const userService = new UserService(null, prisonerService) as jest.Mocked<UserService>
const auditService = new AuditService() as jest.Mocked<AuditService>
const calculateReleaseDatesService = new CalculateReleaseDatesService(
  auditService,
  null,
) as jest.Mocked<CalculateReleaseDatesService>
const viewReleaseDatesService = new ViewReleaseDatesService(null) as jest.Mocked<ViewReleaseDatesService>

let app: Express
beforeEach(() => {
  config.featureToggles.sdsExclusionIndicatorsEnabled = false
  app = appWithAllRoutes({
    services: {
      userService,
      prisonerService,
      calculateReleaseDatesService,
      viewReleaseDatesService,
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Check access tests', () => {
  const runTest = async (routes: { method: 'GET' | 'POST'; url: string }[]) => {
    await Promise.all(
      routes.map(route => {
        const requested = route.method === 'GET' ? request(app).get(route.url) : request(app).post(route.url)
        return requested
          .expect(404)
          .expect('Content-Type', /html/)
          .expect(res => {
            expect(res.text).toContain('The details for this person cannot be found')
          })
      }),
    )
  }

  it('Check urls no access when not in caseload', async () => {
    prisonerService.getPrisonerDetail.mockImplementation(() => {
      throw FullPageError.notInCaseLoadError()
    })
    prisonerService.checkPrisonerAccess.mockImplementation(() => {
      throw FullPageError.notInCaseLoadError()
    })

    const routes: { method: 'GET' | 'POST'; url: string }[] = [
      { method: 'GET', url: '/view/A1234AA/nomis-calculation-summary/-1' },
      { method: 'GET', url: '/view/A1234AA/sentences-and-offences/123456' },
      { method: 'GET', url: '/view/A1234AA/calculation-summary/123456' },
      { method: 'GET', url: '/view/A1234AA/calculation-summary/123456/print' },
      { method: 'GET', url: '/view/A1234AA/calculation-summary/123456/printNotificationSlip?fromPage=view' },
      {
        method: 'GET',
        url: '/view/A1234AA/calculation-summary/123456/printNotificationSlip?fromPage=view&pageType=offender',
      },
      {
        method: 'GET',
        url: '/view/A1234AA/calculation-summary/123456/printNotificationSlip?fromPage=view&pageType=establishment',
      },
      { method: 'GET', url: '/calculation/A1234AA/summary/123456/printNotificationSlip?fromPage=calculation' },
      {
        method: 'GET',
        url: '/calculation/A1234AA/summary/123456/printNotificationSlip?fromPage=calculation&pageType=offender',
      },
      {
        method: 'GET',
        url: '/calculation/A1234AA/summary/123456/printNotificationSlip?fromPage=calculation&pageType=establishment',
      },
    ]

    await runTest(routes)
  })
})

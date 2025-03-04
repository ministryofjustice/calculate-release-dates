import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes } from './routes/testutils/appSetup'
import CalculateReleaseDatesService from './services/calculateReleaseDatesService'
import AuditService from './services/auditService'

jest.mock('./services/calculateReleaseDatesService')
jest.mock('./services/auditService')

const auditService = new AuditService() as jest.Mocked<AuditService>
const calculateReleaseDatesService = new CalculateReleaseDatesService(
  auditService,
) as jest.Mocked<CalculateReleaseDatesService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET 404', () => {
  it('should render content with stack in dev mode', () => {
    return request(app)
      .get('/unknown')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('<pre>')
        expect(res.text).toContain(
          'mailto:calculatereleasedates@digital.justice.gov.uk?subject=Calculate%20release%20dates%20-%20Page%20not%20found',
        )
      })
  })

  it('should render content without stack in production mode', () => {
    return request(appWithAllRoutes({ production: true, services: { calculateReleaseDatesService } }))
      .get('/unknown')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('<pre>')
        expect(res.text).toContain(
          'mailto:calculatereleasedates@digital.justice.gov.uk?subject=Calculate%20release%20dates%20-%20Page%20not%20found',
        )
      })
  })
})

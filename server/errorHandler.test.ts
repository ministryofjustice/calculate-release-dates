import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes } from './routes/testutils/appSetup'
import CalculateReleaseDatesService from './services/calculateReleaseDatesService'

jest.mock('./services/calculateReleaseDatesService')

const calculateReleaseDatesService = new CalculateReleaseDatesService() as jest.Mocked<CalculateReleaseDatesService>

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
          'Email <a href="mailto:calculatereleasedates@digital.justice.gov.uk?subject=Calculate release dates - Page not found">calculatereleasedates@digital.justice.gov.uk</a>'
        )
      })
  })

  it('should render content without stack in production mode', () => {
    return request(appWithAllRoutes({ calculateReleaseDatesService }, true))
      .get('/unknown')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('<pre>')
        expect(res.text).toContain(
          'Email <a href="mailto:calculatereleasedates@digital.justice.gov.uk?subject=Calculate release dates - Page not found">calculatereleasedates@digital.justice.gov.uk</a>'
        )
      })
  })
})

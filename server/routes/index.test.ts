import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import config from '../config'

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  config.maintenanceMode = false
  jest.resetAllMocks()
})

describe('GET /', () => {
  it('should render index page', () => {
    return request(app).get('/').expect(302).expect('Location', config.apis.digitalPrisonServices.ui_url)
  })

  it('should render maintenance page', () => {
    config.maintenanceMode = true
    return request(appWithAllRoutes({}))
      .get('/')
      .expect(503)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const oosHeader = $('[data-qa=oos-header]').first()
        expect(oosHeader.text()).toStrictEqual('Sorry, there is a problem with the service')
        expect(res.text).toContain('courtcasesandreleasedates@justice.gov.uk')
      })
  })
})

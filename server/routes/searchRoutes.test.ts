import request from 'supertest'
import type { Express } from 'express'
import { appWithAllRoutes } from './testutils/appSetup'
import PrisonerService from '../services/prisonerService'
import config from '../config'

jest.mock('../services/prisonerService')

const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({ services: { prisonerService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('DEPRECATED: GET Search routes for /search/prisoners', () => {
  it('Should redirect to DPS', () => {
    request(app).get('/').expect(302).expect('Location', config.apis.digitalPrisonServices.ui_url)
  })
})

import request from 'supertest'
import type { Express } from 'express'
import { appWithAllRoutes } from './testutils/appSetup'
import PrisonerService from '../services/prisonerService'
import UserService from '../services/userService'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'

jest.mock('../services/userService')
jest.mock('../services/calculateReleaseDatesService')
jest.mock('../services/prisonerService')

const userService = new UserService(null) as jest.Mocked<UserService>
const calculateReleaseDatesService = new CalculateReleaseDatesService(null) as jest.Mocked<CalculateReleaseDatesService>
const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({ userService, prisonerService, calculateReleaseDatesService })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Tests for error routes', () => {
  it('Should display error page for prisoner not accessible', () => {
    return request(app)
      .get('/error/prisoner-not-accessible')
      .expect(403)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('The prisoner is not in your caseload')
      })
  })
})

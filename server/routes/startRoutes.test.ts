import request from 'supertest'
import type { Express } from 'express'
import { appWithAllRoutes } from './testutils/appSetup'
import EntryPointService from '../services/entrypointService'

jest.mock('../services/entryPointService')

const entryPointService = new EntryPointService() as jest.Mocked<EntryPointService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({ entryPointService })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Start routes tests', () => {
  it('GET / should return start page in standalone journey', () => {
    return request(app)
      .get('/')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Start')
        expect(res.text).toContain('href="/search/prisoners"')
      })
      .expect(() => {
        expect(entryPointService.setStandaloneEntrypointCookie.mock.calls.length).toBe(1)
        expect(entryPointService.setDpsEntrypointCookie.mock.calls.length).toBe(0)
      })
  })
  it('GET ?prisonId=123 should return start page in DPS journey', () => {
    return request(app)
      .get('?prisonId=123')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Start')
        expect(res.text).toContain('href="/calculation/123/check-information"')
      })
      .expect(() => {
        expect(entryPointService.setDpsEntrypointCookie.mock.calls.length).toBe(1)
        expect(entryPointService.setStandaloneEntrypointCookie.mock.calls.length).toBe(0)
      })
  })
})

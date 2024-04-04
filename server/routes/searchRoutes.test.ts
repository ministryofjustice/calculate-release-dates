import request from 'supertest'
import type { Express } from 'express'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from './testutils/appSetup'
import PrisonerService from '../services/prisonerService'
import { Prisoner } from '../@types/prisonerOffenderSearch/prisonerSearchClientTypes'

jest.mock('../services/prisonerService')

const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>

let app: Express

const prisoner = {
  prisonerNumber: 'A123456',
} as Prisoner

beforeEach(() => {
  app = appWithAllRoutes({ services: { prisonerService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET Search routes for /search/prisoners', () => {
  it('Should display default page if no search params entered', () => {
    return request(app)
      .get('/search/prisoners')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Search for a prisoner')
        expect(res.text).not.toContain('There are no matching results')
      })
  })

  it('Should should return no results if user has no caseloads', () => {
    app = appWithAllRoutes({
      services: { prisonerService },
      userSupplier: () => {
        return { ...user, caseloads: [] }
      },
    })
    prisonerService.searchPrisoners.mockResolvedValue([])
    return request(app)
      .get('/search/prisoners?firstName=oj')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('There are no matching results')
      })
  })

  it('Should should return no results if if there is no match', () => {
    app = appWithAllRoutes({
      services: { prisonerService },
      userSupplier: () => {
        return { ...user, caseloads: ['MDI'] }
      },
    })
    prisonerService.searchPrisoners.mockResolvedValue([])
    return request(app)
      .get('/search/prisoners?firstName=oj')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('There are no matching results')
      })
  })

  it('Should display matching results', () => {
    app = appWithAllRoutes({
      services: { prisonerService },
      userSupplier: () => {
        return { ...user, caseloads: ['MDI'] }
      },
    })
    prisonerService.searchPrisoners.mockResolvedValue([prisoner])
    return request(app)
      .get('/search/prisoners?firstName=oj')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('A123456')
        expect(res.text).not.toContain('There are no matching results')
      })
  })

  it('Should link to the ccard page', () => {
    prisonerService.searchPrisoners.mockResolvedValue([prisoner])
    app = appWithAllRoutes({
      services: { prisonerService },
      userSupplier: () => {
        return { ...user, caseloads: ['MDI'] }
      },
    })

    return request(app)
      .get('/search/prisoners?prisonerIdentifier=A123456')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('/?prisonId=A123456')
        const $ = cheerio.load(res.text)
        expect($('.govuk-back-link')).toHaveLength(0)
      })
  })
})

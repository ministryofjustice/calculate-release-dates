import request from 'supertest'
import type { Express } from 'express'
import { appWithAllRoutes, user } from './testutils/appSetup'
import PrisonerService from '../services/prisonerService'
import { PrisonApiUserCaseloads } from '../@types/prisonApi/prisonClientTypes'
import { Prisoner } from '../@types/prisonerOffenderSearch/prisonerSearchClientTypes'
import config from '../config'

jest.mock('../services/prisonerService')

const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>

let app: Express

const caseload = {
  caseLoadId: 'MDI',
} as PrisonApiUserCaseloads

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

  it('Should display default view search page if no search params entered', () => {
    return request(app)
      .get('/view/search/prisoners')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Look up a person to see their release dates')
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

  it('Should link to the reason page if enabled', () => {
    prisonerService.searchPrisoners.mockResolvedValue([prisoner])

    config.featureToggles.calculationReasonToggle = true
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
        expect(res.text).toContain('/calculation/A123456/reason')
      })
  })
})

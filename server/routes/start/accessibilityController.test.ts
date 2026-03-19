import request from 'supertest'
import type { Express } from 'express'
import { appWithAllRoutes, user } from '../testutils/appSetup'
import config from '../../config'

describe('AccessibilityController', () => {
  let app: Express

  beforeEach(() => {
    config.adjustments = { url: 'http://localhost:3000/adjustments' }
    config.apis.courtCasesAndReleaseDatesUi = { url: 'http://ccard.local' }

    app = appWithAllRoutes({
      services: {},
      userSupplier: () => ({ ...user }),
    })
  })

  it('redirects to CCARD accessibility page', async () => {
    const res = await request(app).get('/accessibility').expect(302)
    expect(res.header.location).toBe(`${config.apis.courtCasesAndReleaseDatesUi.url}/accessibility`)
  })
})

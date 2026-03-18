import request from 'supertest'
import type { Express } from 'express'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../testutils/appSetup'

describe('SupportedSentencesController', () => {
  let app: Express

  beforeEach(() => {
    app = appWithAllRoutes({
      services: {},
      userSupplier: () => ({ ...user }),
    })
  })

  it('renders supported sentences page with nomsId', async () => {
    const nomsId = 'A1234AB'
    const res = await request(app).get(`/supported-sentences/${nomsId}`).expect(200)

    const $ = cheerio.load(res.text)
    expect($('[data-qa=main-heading]').text()).toContain('Supported sentences')
  })
})

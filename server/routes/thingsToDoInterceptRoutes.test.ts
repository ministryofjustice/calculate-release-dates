import request from 'supertest'
import type { Express } from 'express'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from './testutils/appSetup'
import PrisonerService from '../services/prisonerService'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { CcrdServiceDefinitions } from '../@types/courtCasesReleaseDatesApi/types'
import CourtCasesReleaseDatesService from '../services/courtCasesReleaseDatesService'
import AuthorisedRoles from '../enumerations/authorisedRoles'

jest.mock('../services/prisonerService')
jest.mock('../services/courtCasesReleaseDatesService')

const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const courtCasesReleaseDatesService = new CourtCasesReleaseDatesService() as jest.Mocked<CourtCasesReleaseDatesService>

let app: Express

const stubbedPrisonerData = {
  offenderNo: 'A1234AA',
  firstName: 'Anon',
  lastName: 'Nobody',
} as PrisonApiPrisoner

const serviceDefinitionsOnlyCrdThingsToDo = {
  services: {
    overview: {
      href: 'http://localhost:8000/prisoner/A1234AA/overview',
      text: 'Overview',
      thingsToDo: {
        things: [],
        count: 0,
      },
    },
    adjustments: {
      href: 'http://localhost:8002/A1234AA',
      text: 'Adjustments',
      thingsToDo: {
        things: [],
        count: 0,
      },
    },
    releaseDates: {
      href: 'http://localhost:8004?prisonId=A1234AA',
      text: 'Release dates and calculations',
      thingsToDo: {
        things: [
          {
            buttonHref: '/',
            buttonText: '',
            message: '',
            title: '',
            type: 'CALCULATION_REQUIRED',
          },
        ],
        count: 1,
      },
    },
  },
} as CcrdServiceDefinitions

const serviceDefinitionsOnlyAdjustmentsThingsToDo = {
  services: {
    overview: {
      href: 'http://localhost:8000/prisoner/A1234AA/overview',
      text: 'Overview',
      thingsToDo: {
        things: [],
        count: 0,
      },
    },
    adjustments: {
      href: 'http://localhost:8002/A1234AA',
      text: 'Adjustments',
      thingsToDo: {
        things: [
          {
            title: 'There are periods of remand to review',
            message:
              'This service has identified periods of remand that may be relevant. You must review this remand periods before calculating a release date.',
            buttonText: 'Review remand',
            buttonHref: 'https://identify-remand-periods-dev.hmpps.service.justice.gov.uk/prisoner/A1234AA',
            type: 'REVIEW_IDENTIFIED_REMAND',
          },
          {
            title: 'Review ADA updates',
            message: 'Updates have been made to ADA (Additional days awarded) information, which need to be approved.',
            buttonText: 'Review ADA',
            buttonHref:
              'https://adjust-release-dates-dev.hmpps.service.justice.gov.uk/A1234AA/additional-days/review-and-approve',
            type: 'ADA_INTERCEPT',
          },
        ],
        count: 2,
      },
    },
    releaseDates: {
      href: 'http://localhost:8004?prisonId=A1234AA',
      text: 'Release dates and calculations',
      thingsToDo: {
        things: [],
        count: 0,
      },
    },
  },
} as CcrdServiceDefinitions

beforeEach(() => {
  app = appWithAllRoutes({
    services: { prisonerService, courtCasesReleaseDatesService },
    userSupplier: () => {
      return { ...user, userRoles: [AuthorisedRoles.ROLE_RELEASE_DATES_CALCULATOR, 'ROLE_ADJUSTMENTS_MAINTAINER'] }
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Intercept when there are things to do', () => {
  it('GET /calculation/:nomsId/things-to-do-before-calculation should render intercept page', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsOnlyAdjustmentsThingsToDo)

    return request(app)
      .get('/calculation/A1234AA/things-to-do-before-calculation')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const interuptionCard = $('.moj-interruption-card')
        expect(interuptionCard.find('ul li:eq(0)').text()).toStrictEqual(
          'This service has identified periods of remand that may be relevant. You must review this remand periods before calculating a release date.',
        )
        expect(interuptionCard.find('ul li:eq(1)').text()).toStrictEqual(
          'Updates have been made to ADA (Additional days awarded) information, which need to be approved.',
        )
        const button = interuptionCard.find('.govuk-button')
        expect(button.text().trim()).toStrictEqual('Review remand')
        expect(button.attr('href')).toStrictEqual(
          'https://identify-remand-periods-dev.hmpps.service.justice.gov.uk/prisoner/A1234AA',
        )
      })
  })
  it('GET /calculation/:nomsId/things-to-do-before-calculation should redirect if nothing to do', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsOnlyCrdThingsToDo)

    return request(app)
      .get('/calculation/A1234AA/things-to-do-before-calculation')
      .expect(302)
      .expect('Location', '/?prisonId=A1234AA')
  })
})

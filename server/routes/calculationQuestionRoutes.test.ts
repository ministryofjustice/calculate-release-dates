import request from 'supertest'
import type { Express } from 'express'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from './testutils/appSetup'
import PrisonerService from '../services/prisonerService'
import UserService from '../services/userService'
import {
  PrisonAPIAssignedLivingUnit,
  PrisonApiPrisoner,
  PrisonApiSentenceDetail,
} from '../@types/prisonApi/prisonClientTypes'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import { expectMiniProfile } from './testutils/layoutExpectations'
import { FullPageError } from '../types/FullPageError'
import { CcrdServiceDefinitions } from '../@types/courtCasesReleaseDatesApi/types'
import CourtCasesReleaseDatesService from '../services/courtCasesReleaseDatesService'
import config from '../config'
import AuthorisedRoles from '../enumerations/authorisedRoles'
import AuditService from '../services/auditService'

jest.mock('../services/userService')
jest.mock('../services/calculateReleaseDatesService')
jest.mock('../services/prisonerService')
jest.mock('../services/userInputService')
jest.mock('../services/courtCasesReleaseDatesService')
jest.mock('../services/auditService')

const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const userService = new UserService(null, prisonerService) as jest.Mocked<UserService>
const auditService = new AuditService() as jest.Mocked<AuditService>
const calculateReleaseDatesService = new CalculateReleaseDatesService(
  auditService,
) as jest.Mocked<CalculateReleaseDatesService>
const courtCasesReleaseDatesService = new CourtCasesReleaseDatesService() as jest.Mocked<CourtCasesReleaseDatesService>

let app: Express

const stubbedPrisonerData = {
  offenderNo: 'A1234AA',
  firstName: 'Anon',
  lastName: 'Nobody',
  latestLocationId: 'LEI',
  locationDescription: 'Inside - Leeds HMP',
  dateOfBirth: '2000-06-24',
  age: 21,
  activeFlag: true,
  legalStatus: 'REMAND',
  category: 'Cat C',
  imprisonmentStatus: 'LIFE',
  imprisonmentStatusDescription: 'Serving Life Imprisonment',
  religion: 'Christian',
  agencyId: 'LEI',
  sentenceDetail: {
    sentenceStartDate: '12/12/2019',
    additionalDaysAwarded: 4,
    tariffDate: '12/12/2030',
    releaseDate: '12/12/2028',
    conditionalReleaseDate: '12/12/2025',
    confirmedReleaseDate: '12/12/2026',
    sentenceExpiryDate: '16/12/2030',
    licenceExpiryDate: '16/12/2030',
  } as PrisonApiSentenceDetail,
  assignedLivingUnit: {
    agencyName: 'Foo Prison (HMP)',
    description: 'D-2-003',
  } as PrisonAPIAssignedLivingUnit,
} as PrisonApiPrisoner
const expectedMiniProfile = {
  name: 'Nobody, Anon',
  dob: '24/06/2000',
  prisonNumber: 'A1234AA',
  establishment: 'Foo Prison (HMP)',
  location: 'D-2-003',
  status: 'Serving Life Imprisonment',
}

const serviceDefinitionsOnlyCrdThingsToDo = {
  services: {
    overview: {
      href: 'http://localhost:8000/prisoner/AB1234AB/overview',
      text: 'Overview',
      thingsToDo: {
        things: [],
        count: 0,
      },
    },
    adjustments: {
      href: 'http://localhost:8002/AB1234AB',
      text: 'Adjustments',
      thingsToDo: {
        things: [],
        count: 0,
      },
    },
    releaseDates: {
      href: 'http://localhost:8004?prisonId=AB1234AB',
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
      href: 'http://localhost:8000/prisoner/AB1234AB/overview',
      text: 'Overview',
      thingsToDo: {
        things: [],
        count: 0,
      },
    },
    adjustments: {
      href: 'http://localhost:8002/AB1234AB',
      text: 'Adjustments',
      thingsToDo: {
        things: [
          {
            buttonHref: '/',
            buttonText: '',
            message: '',
            title: '',
            type: 'ADA_INTERCEPT',
          },
        ],
        count: 1,
      },
    },
    releaseDates: {
      href: 'http://localhost:8004?prisonId=AB1234AB',
      text: 'Release dates and calculations',
      thingsToDo: {
        things: [],
        count: 0,
      },
    },
  },
} as CcrdServiceDefinitions

const stubbedCalculationReasons = [
  { id: 9, isOther: false, displayName: '2 day check' },
  { id: 10, isOther: false, displayName: 'Appeal decision' },
  { id: 11, isOther: true, displayName: 'Other' },
]

beforeEach(() => {
  app = appWithAllRoutes({
    services: { userService, prisonerService, calculateReleaseDatesService, courtCasesReleaseDatesService },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Check access tests', () => {
  const runTest = async routes => {
    await Promise.all(
      routes.map(route =>
        request(app)
          [route.method.toLowerCase()](route.url)
          .expect(404)
          .expect('Content-Type', /html/)
          .expect(res => {
            expect(res.text).toContain('The details for this person cannot be found')
          }),
      ),
    )
  }

  it('Check urls no access when not in caseload', async () => {
    prisonerService.getPrisonerDetail.mockImplementation(() => {
      throw FullPageError.notInCaseLoadError()
    })
    prisonerService.checkPrisonerAccess.mockImplementation(() => {
      throw FullPageError.notInCaseLoadError()
    })

    const routes = [
      { method: 'GET', url: '/calculation/A1234AA/reason' },
      { method: 'POST', url: '/calculation/A1234AA/reason' },
    ]

    await runTest(routes)
  })
})

it('POST /calculation/:nomsId/reason should return to check-information once the calculation reason has been set', () => {
  calculateReleaseDatesService.getCalculationReasons.mockResolvedValue(stubbedCalculationReasons)
  return request(app)
    .post('/calculation/A1234AA/reason/')
    .type('form')
    .send({ calculationReasonId: ['7'] })
    .expect(302)
    .expect(res => {
      expect(res.text).toContain('Found. Redirecting to /calculation/A1234AA/check-information')
    })
})

it('POST /calculation/:nomsId/reason should return to check-information routes if the other reason is selected and the text box has been filled', () => {
  calculateReleaseDatesService.getCalculationReasons.mockResolvedValue(stubbedCalculationReasons)

  return request(app)
    .post('/calculation/A1234AA/reason/')
    .type('form')
    .send({ calculationReasonId: ['11'], otherReasonDescription: 'A reason for calculation' })
    .expect(302)
    .expect(res => {
      expect(res.text).toContain('Found. Redirecting to /calculation/A1234AA/check-information')
    })
})

it('POST /calculation/:nomsId/reason should ask for the calculation reason if it has not been set', () => {
  calculateReleaseDatesService.getCalculationReasons.mockResolvedValue(stubbedCalculationReasons)
  prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)

  return request(app)
    .post('/calculation/A1234AA/reason/')
    .type('form')
    .expect(200)
    .expect(res => {
      const $ = cheerio.load(res.text)
      expect($('[data-qa=cancel-link]').first().attr('href')).toStrictEqual(
        '/calculation/A1234AA/cancelCalculation?redirectUrl=/calculation/A1234AA/reason/',
      )
      expect(res.text).toContain('You must select a reason for the calculation')
      expectMiniProfile(res.text, expectedMiniProfile)
    })
})

it('POST /calculation/:nomsId/reason should return to the reason page and display the error message if the other reason is selected and no text has been entered', () => {
  prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
  calculateReleaseDatesService.getCalculationReasons.mockResolvedValue(stubbedCalculationReasons)

  return request(app)
    .post('/calculation/A1234AA/reason/')
    .type('form')
    .send({ calculationReasonId: ['11'], otherReasonDescription: '' })
    .expect(200)
    .expect(res => {
      const $ = cheerio.load(res.text)
      expect($('[data-qa=cancel-link]').first().attr('href')).toStrictEqual(
        '/calculation/A1234AA/cancelCalculation?redirectUrl=/calculation/A1234AA/reason/',
      )
      expect(res.text).toContain('You must enter a reason for the calculation')
      expectMiniProfile(res.text, expectedMiniProfile)
    })
})

it('POST /calculation/:nomsId/reason should return to the reason page and display the error message and the original text if the other reason is selected and more than 120 characters been entered', () => {
  prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
  calculateReleaseDatesService.getCalculationReasons.mockResolvedValue(stubbedCalculationReasons)

  return request(app)
    .post('/calculation/A1234AA/reason/')
    .type('form')
    .send({
      calculationReasonId: ['11'],
      otherReasonDescription:
        'A string which is at least 120 characters requires quite a bit of padding to get it to the correct length so it can be tested',
    })
    .expect(200)
    .expect(res => {
      const $ = cheerio.load(res.text)
      expect($('[data-qa=cancel-link]').first().attr('href')).toStrictEqual(
        '/calculation/A1234AA/cancelCalculation?redirectUrl=/calculation/A1234AA/reason/',
      )
      expect(res.text).toContain('Reason must be 120 characters or less')
      expect(res.text).toContain(
        'A string which is at least 120 characters requires quite a bit of padding to get it to the correct length so it can be tested',
      )
      expectMiniProfile(res.text, expectedMiniProfile)
    })
})

it('GET /calculation/:nomsId/reason should include the mini profile', () => {
  prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
  calculateReleaseDatesService.getCalculationReasons.mockResolvedValue(stubbedCalculationReasons)
  courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsOnlyCrdThingsToDo)

  return request(app)
    .get('/calculation/A1234AA/reason/')
    .expect(200)
    .expect(res => {
      const $ = cheerio.load(res.text)
      expect($('[data-qa=cancel-link]').first().attr('href')).toStrictEqual(
        '/calculation/A1234AA/cancelCalculation?redirectUrl=/calculation/A1234AA/reason/',
      )
      expectMiniProfile(res.text, expectedMiniProfile)
    })
})
it('GET /calculation/:nomsId/reason should be ada intercepted if there are ada review needed', () => {
  config.featureToggles.thingsToDoIntercept = true
  const testSpecificApp = appWithAllRoutes({
    services: { userService, prisonerService, calculateReleaseDatesService, courtCasesReleaseDatesService },
    userSupplier: () => {
      return { ...user, userRoles: [AuthorisedRoles.ROLE_RELEASE_DATES_CALCULATOR] }
    },
  })
  config.adjustments.url = 'http://localhost:9000'
  prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
  calculateReleaseDatesService.getCalculationReasons.mockResolvedValue(stubbedCalculationReasons)
  courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsOnlyAdjustmentsThingsToDo)

  return request(testSpecificApp)
    .get('/calculation/A1234AA/reason/')
    .expect(302)
    .expect('Location', `${config.adjustments.url}/A1234AA/additional-days/intercept`)
})
it('GET /calculation/:nomsId/reason shouldnt intercepted if toggled off', () => {
  config.featureToggles.thingsToDoIntercept = false
  const testSpecificApp = appWithAllRoutes({
    services: { userService, prisonerService, calculateReleaseDatesService, courtCasesReleaseDatesService },
    userSupplier: () => {
      return { ...user, userRoles: [AuthorisedRoles.ROLE_RELEASE_DATES_CALCULATOR] }
    },
  })
  config.adjustments.url = 'http://localhost:9000'
  prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
  calculateReleaseDatesService.getCalculationReasons.mockResolvedValue(stubbedCalculationReasons)
  courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsOnlyAdjustmentsThingsToDo)

  return request(testSpecificApp)
    .get('/calculation/A1234AA/reason/')
    .expect(200)
    .expect(res => {
      expect(courtCasesReleaseDatesService.getServiceDefinitions.mock.calls.length).toBe(0)
    })
})
it('GET /calculation/:nomsId/reason should not be ada intercepted if they are a support user', () => {
  config.featureToggles.thingsToDoIntercept = true
  const testSpecificApp = appWithAllRoutes({
    services: { userService, prisonerService, calculateReleaseDatesService, courtCasesReleaseDatesService },
    userSupplier: () => {
      return {
        ...user,
        isDigitalSupportUser: true,
        userRoles: [AuthorisedRoles.ROLE_RELEASE_DATES_CALCULATOR],
      }
    },
  })
  config.adjustments.url = 'http://localhost:9000'
  prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
  calculateReleaseDatesService.getCalculationReasons.mockResolvedValue(stubbedCalculationReasons)
  courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsOnlyAdjustmentsThingsToDo)

  return request(testSpecificApp)
    .get('/calculation/A1234AA/reason/')
    .expect(200)
    .expect(res => {
      expect(courtCasesReleaseDatesService.getServiceDefinitions.mock.calls.length).toBe(0)
    })
})

it('GET /calculation/:nomsId/reason back should take you to CCARD landing page', () => {
  prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
  calculateReleaseDatesService.getCalculationReasons.mockResolvedValue(stubbedCalculationReasons)
  courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsOnlyCrdThingsToDo)

  return request(app)
    .get('/calculation/A1234AA/reason/')
    .expect(200)
    .expect(res => {
      const $ = cheerio.load(res.text)
      expect($('.govuk-back-link').first().attr('href')).toStrictEqual('/?prisonId=A1234AA')
    })
})

import { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import { appWithAllRoutes, flashProvider, user } from '../testutils/appSetup'
import SessionSetup from '../testutils/sessionSetup'
import PrisonerService from '../../services/prisonerService'
import {
  PrisonAPIAssignedLivingUnit,
  PrisonApiPrisoner,
  PrisonApiSentenceDetail,
} from '../../@types/prisonApi/prisonClientTypes'
import { expectMiniProfile } from '../testutils/layoutExpectations'
import config from '../../config'
import AuthorisedRoles from '../../enumerations/authorisedRoles'
import CourtCasesReleaseDatesService from '../../services/courtCasesReleaseDatesService'
import { CcrdServiceDefinitions } from '../../@types/courtCasesReleaseDatesApi/types'
import { FullPageError } from '../../types/FullPageError'

jest.mock('../../services/calculateReleaseDatesService')
jest.mock('../../services/prisonerService')
jest.mock('../../services/courtCasesReleaseDatesService')

describe('CalculationReasonController', () => {
  let app: Express
  const sessionSetup = new SessionSetup()

  const calculateReleaseDatesService = new CalculateReleaseDatesService(
    null,
  ) as jest.Mocked<CalculateReleaseDatesService>
  const prisonerService = new PrisonerService(null, null) as jest.Mocked<PrisonerService>
  const courtCasesReleaseDatesService = new CourtCasesReleaseDatesService(
    null,
  ) as jest.Mocked<CourtCasesReleaseDatesService>

  const prisonerNumber = 'A1234AA'
  let currentUser: Express.User
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
    { id: 8, isOther: false, displayName: 'Add dates', useForApprovedDates: true },
    { id: 9, isOther: false, displayName: '2 day check', useForApprovedDates: false },
    { id: 10, isOther: false, displayName: 'Appeal decision', useForApprovedDates: false },
    { id: 11, isOther: true, displayName: 'Other', useForApprovedDates: false },
  ]

  let currentSession: SessionData

  beforeEach(() => {
    config.featureToggles.showBreakdown = true
    currentUser = {
      ...user,
      userRoles: [AuthorisedRoles.ROLE_RELEASE_DATES_CALCULATOR],
    }
    sessionSetup.sessionDoctor = req => {
      req.session.isAddDatesFlow = {}
      req.session.isAddDatesFlow[prisonerNumber] = false
      currentSession = req.session
    }

    app = appWithAllRoutes({
      services: {
        calculateReleaseDatesService,
        prisonerService,
        courtCasesReleaseDatesService,
      },
      sessionSetup,
      userSupplier: () => {
        return { ...currentUser }
      },
    })
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
  })

  afterEach(() => {
    jest.resetAllMocks()
    config.featureToggles.showBreakdown = true
  })

  describe('GET', () => {
    it('GET /calculation/:nomsId/reason should require prisoner in caseload', () => {
      prisonerService.getPrisonerDetail.mockImplementation(() => {
        throw FullPageError.notInCaseLoadError()
      })
      calculateReleaseDatesService.getCalculationReasons.mockResolvedValue(stubbedCalculationReasons)
      courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsOnlyCrdThingsToDo)

      return request(app)
        .get('/calculation/A1234AA/reason/')
        .expect(404)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('The details for this person cannot be found')
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
            '/calculation/A1234AA/cancelCalculation?redirectUrl=/calculation/A1234AA/reason',
          )
          expectMiniProfile(res.text, expectedMiniProfile)
          expect(currentSession.isAddDatesFlow[prisonerNumber]).toStrictEqual(false)
        })
    })
    it('GET /calculation/:nomsId/reason?isAddDatesFlow=true should set the reason to approved dates reason and redirect to check information', () => {
      prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      calculateReleaseDatesService.getCalculationReasons.mockResolvedValue(stubbedCalculationReasons)
      courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsOnlyCrdThingsToDo)

      return request(app)
        .get('/calculation/A1234AA/reason?isAddDatesFlow=true')
        .expect(302)
        .expect('Location', '/calculation/A1234AA/check-information')
        .expect(_ => {
          expect(currentSession.calculationReasonId[prisonerNumber]).toStrictEqual(8)
          expect(currentSession.otherReasonDescription[prisonerNumber]).toBeUndefined()
          expect(currentSession.isAddDatesFlow[prisonerNumber]).toStrictEqual(true)
        })
    })
    it('GET /calculation/:nomsId/reason should be ada intercepted if there are ada review needed', () => {
      config.featureToggles.thingsToDoIntercept = true
      config.adjustments.url = 'http://localhost:9000'
      prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      calculateReleaseDatesService.getCalculationReasons.mockResolvedValue(stubbedCalculationReasons)
      courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsOnlyAdjustmentsThingsToDo)

      return request(app)
        .get('/calculation/A1234AA/reason')
        .expect(302)
        .expect('Location', `${config.adjustments.url}/A1234AA/additional-days/intercept`)
    })
    it('GET /calculation/:nomsId/reason shouldnt intercepted if toggled off', () => {
      config.featureToggles.thingsToDoIntercept = false
      config.adjustments.url = 'http://localhost:9000'
      prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      calculateReleaseDatesService.getCalculationReasons.mockResolvedValue(stubbedCalculationReasons)
      courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsOnlyAdjustmentsThingsToDo)

      return request(app)
        .get('/calculation/A1234AA/reason/')
        .expect(200)
        .expect(res => {
          expect(courtCasesReleaseDatesService.getServiceDefinitions.mock.calls.length).toBe(0)
        })
    })
    it('GET /calculation/:nomsId/reason should not be ada intercepted if they are a support user', () => {
      config.featureToggles.thingsToDoIntercept = true
      config.adjustments.url = 'http://localhost:9000'
      currentUser = {
        ...user,
        isDigitalSupportUser: true,
        userRoles: [AuthorisedRoles.ROLE_RELEASE_DATES_CALCULATOR],
      }
      prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      calculateReleaseDatesService.getCalculationReasons.mockResolvedValue(stubbedCalculationReasons)
      courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsOnlyAdjustmentsThingsToDo)

      return request(app)
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
        .get('/calculation/A1234AA/reason')
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-back-link').first().attr('href')).toStrictEqual('/?prisonId=A1234AA')
        })
    })
  })

  describe('POST', () => {
    it('POST /calculation/:nomsId/reason should be blocked if prisoner not in caseload', () => {
      prisonerService.checkPrisonerAccess.mockImplementation(() => {
        throw FullPageError.notInCaseLoadError()
      })
      calculateReleaseDatesService.getCalculationReasons.mockResolvedValue(stubbedCalculationReasons)
      return request(app)
        .post('/calculation/A1234AA/reason/')
        .type('form')
        .send({ calculationReasonId: '7', otherReasonId: '11' })
        .expect(404)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('The details for this person cannot be found')
        })
    })

    it('POST /calculation/:nomsId/reason should return to check-information once the calculation reason has been set', () => {
      calculateReleaseDatesService.getCalculationReasons.mockResolvedValue(stubbedCalculationReasons)
      return request(app)
        .post('/calculation/A1234AA/reason/')
        .type('form')
        .send({ calculationReasonId: '7', otherReasonId: '11' })
        .expect(302)
        .expect('Location', '/calculation/A1234AA/check-information')
    })

    it('POST /calculation/:nomsId/reason should return to check-information routes if the other reason is selected and the text box has been filled', () => {
      calculateReleaseDatesService.getCalculationReasons.mockResolvedValue(stubbedCalculationReasons)

      return request(app)
        .post('/calculation/A1234AA/reason/')
        .type('form')
        .send({ calculationReasonId: '11', otherReasonId: '11', otherReasonDescription: 'A reason for calculation' })
        .expect(302)
        .expect('Location', '/calculation/A1234AA/check-information')
    })

    it('POST /calculation/:nomsId/reason should ask for the calculation reason if it has not been set', () => {
      calculateReleaseDatesService.getCalculationReasons.mockResolvedValue(stubbedCalculationReasons)
      prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)

      return request(app)
        .post('/calculation/A1234AA/reason')
        .type('form')
        .send({ otherReasonId: '11' })
        .expect(302)
        .expect('Location', '/calculation/A1234AA/reason#')
        .expect(res => {
          expect(flashProvider).toHaveBeenCalledWith(
            'validationErrors',
            JSON.stringify({ calculationReasonId: ['You must select a reason for this calculation'] }),
          )
        })
    })

    it('POST /calculation/:nomsId/reason should return to the reason page and display the error message if the other reason is selected and no text has been entered', () => {
      prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      calculateReleaseDatesService.getCalculationReasons.mockResolvedValue(stubbedCalculationReasons)

      return request(app)
        .post('/calculation/A1234AA/reason')
        .type('form')
        .send({ calculationReasonId: '11', otherReasonDescription: '', otherReasonId: '11' })
        .expect(302)
        .expect('Location', '/calculation/A1234AA/reason#')
        .expect(res => {
          expect(flashProvider).toHaveBeenCalledWith(
            'validationErrors',
            JSON.stringify({ otherReasonDescription: ['Enter the reason for this calculation'] }),
          )
        })
    })

    it('POST /calculation/:nomsId/reason should return to the reason page and display the error message and the original text if the other reason is selected and more than 120 characters been entered', () => {
      prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      calculateReleaseDatesService.getCalculationReasons.mockResolvedValue(stubbedCalculationReasons)

      return request(app)
        .post('/calculation/A1234AA/reason')
        .type('form')
        .send({
          calculationReasonId: '11',
          otherReasonId: '11',
          otherReasonDescription:
            'A string which is at least 120 characters requires quite a bit of padding to get it to the correct length so it can be tested',
        })
        .expect(302)
        .expect('Location', '/calculation/A1234AA/reason#')
        .expect(_ => {
          expect(flashProvider).toHaveBeenCalledWith(
            'validationErrors',
            JSON.stringify({
              otherReasonDescription: ['The reason for this calculation must be 120 characters or less'],
            }),
          )
        })
    })
  })
})

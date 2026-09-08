import { type Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import UserPermissionsService from '../../services/userPermissionsService'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import CourtCasesReleaseDatesService from '../../services/courtCasesReleaseDatesService'
import PrisonerService from '../../services/prisonerService'
import {
  PrisonAPIAssignedLivingUnit,
  PrisonApiPrisoner,
  PrisonApiSentenceDetail,
} from '../../@types/prisonApi/prisonClientTypes'
import { CcrdServiceDefinitions } from '../../@types/courtCasesReleaseDatesApi/types'
import { appWithAllRoutes, user } from '../testutils/appSetup'
import AuthorisedRoles from '../../enumerations/authorisedRoles'
import config from '../../config'
import { PrisonerCalculationOverview } from '../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

jest.mock('../../services/calculateReleaseDatesService')
jest.mock('../../services/userPermissionsService')
jest.mock('../../services/courtCasesReleaseDatesService')
jest.mock('../../services/prisonerService')

const calculateReleaseDatesService = new CalculateReleaseDatesService(
  null,
  null,
) as jest.Mocked<CalculateReleaseDatesService>
const userPermissionsService = new UserPermissionsService() as jest.Mocked<UserPermissionsService>
const courtCasesReleaseDatesService = new CourtCasesReleaseDatesService(
  null,
) as jest.Mocked<CourtCasesReleaseDatesService>
const prisonerService = new PrisonerService(null, null) as jest.Mocked<PrisonerService>

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
  agencyId: 'MDI',
  status: 'ACTIVE IN',
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

const serviceDefinitionsNoThingsToDo = {
  services: {
    overview: {
      href: 'http://localhost:8000/prisoner/AB1234AB/overview',
      text: 'Overview',
      thingsToDo: {
        things: [],
        count: 0,
      },
      maintenanceAlert: {
        enabled: false,
        message: 'placeholder',
      },
    },
    adjustments: {
      href: 'http://localhost:8002/AB1234AB',
      text: 'Adjustments',
      thingsToDo: {
        things: [],
        count: 0,
      },
      maintenanceAlert: {
        enabled: false,
        message: 'placeholder',
      },
    },
    releaseDates: {
      href: 'http://localhost:8004?prisonId=AB1234AB',
      text: 'Release dates and calculations',
      thingsToDo: {
        things: [],
        count: 0,
      },
      maintenanceAlert: {
        enabled: false,
        message: 'placeholder',
      },
    },
  },
  maintenanceAlert: {
    enabled: false,
    message: 'placeholder',
  },
} as CcrdServiceDefinitions

beforeEach(() => {
  app = appWithAllRoutes({
    services: { calculateReleaseDatesService, userPermissionsService, courtCasesReleaseDatesService, prisonerService },
    userSupplier: () => ({ ...user, userRoles: [AuthorisedRoles.ROLE_RELEASE_DATES_CALCULATOR] }),
  })
  prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
  userPermissionsService.allowBulkLoad.mockReturnValue(false)
  calculateReleaseDatesService.hasIndeterminateSentences.mockResolvedValue(false)
  courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsNoThingsToDo)
  config.featureToggles.secondCheckEnabled = true
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /:nomsId/overview', () => {
  describe('Navigation scenarios', () => {
    it('If there are things to do then do not show latest calculation', () => {
      const serviceDefinitionsAdjustmentsThingsToDo = {
        services: {
          adjustments: {
            href: 'http://localhost:8002/AB1234AB',
            text: 'Adjustments',
            thingsToDo: {
              things: [
                {
                  buttonHref: '/',
                  buttonText: '',
                  message: '',
                  title: 'Review ADAs',
                  type: 'ADA_INTERCEPT',
                  messageIsHtml: false,
                },
              ],
              count: 1,
              severity: 'REQUIRED_BEFORE_CALCULATION',
            },
            maintenanceAlert: {
              enabled: false,
              message: 'placeholder',
            },
          },
          releaseDates: {
            href: 'http://localhost:8004?prisonId=AB1234AB',
            text: 'Release dates and calculations',
            thingsToDo: {
              things: [],
              count: 0,
            },
            maintenanceAlert: {
              enabled: false,
              message: 'placeholder',
            },
          },
        },
        maintenanceAlert: {
          enabled: false,
          message: 'placeholder',
        },
      } as CcrdServiceDefinitions

      const overview: PrisonerCalculationOverview = {
        latestCalculation: {
          prisonerId: stubbedPrisonerData.offenderNo,
          bookingId: stubbedPrisonerData.bookingId,
          calculatedAt: '2024-03-05',
          reason: 'New Sentence',
          source: 'CRDS',
          dates: [],
          calculatedByUsername: 'user1',
          calculatedByDisplayName: 'Bob Smith',
          establishment: 'HMP ABC',
          calculationType: 'CALCULATED',
        },
        recentCalculations: [],
        totalCalculationCount: 0,
        hasIndeterminateSentences: false,
        numberOfSentences: 5,
      }
      calculateReleaseDatesService.getPrisonCalculationOverview.mockResolvedValue(overview)
      courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsAdjustmentsThingsToDo)

      return request(app)
        .get(`/${stubbedPrisonerData.offenderNo}/overview`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-qa=latest-calc-heading]')).toHaveLength(0)
          expect($('[aria-label="Review ADAs"]')).toHaveLength(1)
        })
    })
    it('If there are things to do but not required before a calculation then do show latest calculation', () => {
      const serviceDefinitionsDocsThingsToDo = {
        services: {
          documents: {
            href: 'http://localhost:8002/AB1234AB',
            text: 'Documents',
            thingsToDo: {
              things: [
                {
                  buttonHref: '/',
                  buttonText: '',
                  message: '',
                  title: 'New court case',
                  type: 'WARRANT_NEW_COURT_CASE',
                  messageIsHtml: false,
                },
              ],
              count: 1,
              severity: 'NOTIFICATION',
            },
            maintenanceAlert: {
              enabled: false,
              message: 'placeholder',
            },
          },
          releaseDates: {
            href: 'http://localhost:8004?prisonId=AB1234AB',
            text: 'Release dates and calculations',
            thingsToDo: {
              things: [],
              count: 0,
            },
            maintenanceAlert: {
              enabled: false,
              message: 'placeholder',
            },
          },
        },
        maintenanceAlert: {
          enabled: false,
          message: 'placeholder',
        },
      } as CcrdServiceDefinitions

      const overview: PrisonerCalculationOverview = {
        latestCalculation: {
          prisonerId: stubbedPrisonerData.offenderNo,
          bookingId: stubbedPrisonerData.bookingId,
          calculatedAt: '2024-03-05',
          reason: 'New Sentence',
          source: 'CRDS',
          dates: [],
          calculatedByUsername: 'user1',
          calculatedByDisplayName: 'Bob Smith',
          establishment: 'HMP ABC',
          calculationType: 'CALCULATED',
        },
        recentCalculations: [],
        totalCalculationCount: 0,
        hasIndeterminateSentences: false,
        numberOfSentences: 5,
      }
      calculateReleaseDatesService.getPrisonCalculationOverview.mockResolvedValue(overview)
      courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsDocsThingsToDo)

      return request(app)
        .get(`/${stubbedPrisonerData.offenderNo}/overview`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-qa=latest-calc-heading]')).toHaveLength(1)
          expect($('[aria-label="New court case"]')).toHaveLength(0)
        })
    })

    it('Show correct navigation when the latest calculation was CRDS there are no indeterminate sentences', () => {
      const overview: PrisonerCalculationOverview = {
        latestCalculation: {
          prisonerId: stubbedPrisonerData.offenderNo,
          bookingId: stubbedPrisonerData.bookingId,
          calculatedAt: '2024-03-05',
          reason: 'New Sentence',
          source: 'CRDS',
          dates: [],
          calculatedByUsername: 'user1',
          calculatedByDisplayName: 'Bob Smith',
          establishment: 'HMP ABC',
          calculationType: 'CALCULATED',
        },
        recentCalculations: [],
        totalCalculationCount: 0,
        hasIndeterminateSentences: false,
        numberOfSentences: 5,
      }
      calculateReleaseDatesService.getPrisonCalculationOverview.mockResolvedValue(overview)

      return request(app)
        .get(`/${stubbedPrisonerData.offenderNo}/overview`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const actions = $('.actions-list').children('ul').children('li')
          expect(actions).toHaveLength(3)
          expect(actions.eq(0).text().trim()).toStrictEqual('Calculate release dates')
          expect(actions.eq(1).text().trim()).toStrictEqual('Record a second calculation check')
          expect(actions.eq(2).text().trim()).toStrictEqual('Add APD, HDCAD or ROTL dates')
        })
    })

    it('Show correct navigation when the latest calculation was NOMIS there are no indeterminate sentences', () => {
      const overview: PrisonerCalculationOverview = {
        latestCalculation: {
          prisonerId: stubbedPrisonerData.offenderNo,
          bookingId: stubbedPrisonerData.bookingId,
          calculatedAt: '2024-03-05',
          reason: 'New Sentence',
          source: 'NOMIS',
          dates: [],
          calculatedByUsername: 'user1',
          calculatedByDisplayName: 'Bob Smith',
          establishment: 'HMP ABC',
          calculationType: 'CALCULATED',
        },
        recentCalculations: [],
        totalCalculationCount: 0,
        hasIndeterminateSentences: false,
        numberOfSentences: 5,
      }
      calculateReleaseDatesService.getPrisonCalculationOverview.mockResolvedValue(overview)

      return request(app)
        .get(`/${stubbedPrisonerData.offenderNo}/overview`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const actions = $('.actions-list').children('ul').children('li')
          expect(actions).toHaveLength(2)
          expect(actions.eq(0).text().trim()).toStrictEqual('Calculate release dates')
          expect(actions.eq(1).text().trim()).toStrictEqual('Add APD, HDCAD or ROTL dates')
        })
    })

    it('Show correct navigation when there are some indeterminate sentences', () => {
      const overview: PrisonerCalculationOverview = {
        latestCalculation: {
          prisonerId: stubbedPrisonerData.offenderNo,
          bookingId: stubbedPrisonerData.bookingId,
          calculatedAt: '2024-03-05',
          reason: 'New Sentence',
          source: 'CRDS',
          dates: [],
          calculatedByUsername: 'user1',
          calculatedByDisplayName: 'Bob Smith',
          establishment: 'HMP ABC',
          calculationType: 'CALCULATED',
        },
        recentCalculations: [],
        totalCalculationCount: 0,
        hasIndeterminateSentences: true,
        numberOfSentences: 5,
      }
      calculateReleaseDatesService.getPrisonCalculationOverview.mockResolvedValue(overview)

      return request(app)
        .get(`/${stubbedPrisonerData.offenderNo}/overview`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const actions = $('.actions-list').children('ul').children('li')
          expect(actions).toHaveLength(2)
          expect(actions.eq(0).text().trim()).toStrictEqual('Calculate release dates')
          expect(actions.eq(1).text().trim()).toStrictEqual('Record a second calculation check')
        })
    })

    it('Show correct navigation when they have access to bulk comparison', () => {
      const overview: PrisonerCalculationOverview = {
        latestCalculation: {
          prisonerId: stubbedPrisonerData.offenderNo,
          bookingId: stubbedPrisonerData.bookingId,
          calculatedAt: '2024-03-05',
          reason: 'New Sentence',
          source: 'CRDS',
          dates: [],
          calculatedByUsername: 'user1',
          calculatedByDisplayName: 'Bob Smith',
          establishment: 'HMP ABC',
          calculationType: 'CALCULATED',
        },
        recentCalculations: [],
        totalCalculationCount: 0,
        hasIndeterminateSentences: true,
        numberOfSentences: 5,
      }
      calculateReleaseDatesService.getPrisonCalculationOverview.mockResolvedValue(overview)
      userPermissionsService.allowBulkLoad.mockReturnValue(true)

      return request(app)
        .get(`/${stubbedPrisonerData.offenderNo}/overview`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const actions = $('.actions-list').children('ul').children('li')
          expect(actions).toHaveLength(3)
          expect(actions.eq(0).text().trim()).toStrictEqual('Calculate release dates')
          expect(actions.eq(1).text().trim()).toStrictEqual('Record a second calculation check')
          expect(actions.eq(2).text().trim()).toStrictEqual('Perform bulk comparison')
        })
    })
  })
  describe('Empty state scenarios', () => {
    it('No latest calc or sentences', () => {
      const overview: PrisonerCalculationOverview = {
        latestCalculation: null,
        recentCalculations: [],
        totalCalculationCount: 0,
        hasIndeterminateSentences: false,
        numberOfSentences: 0,
      }
      calculateReleaseDatesService.getPrisonCalculationOverview.mockResolvedValue(overview)

      return request(app)
        .get(`/${stubbedPrisonerData.offenderNo}/overview`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = $('[data-qa=latest-calc-heading]')
          expect(heading.text().trim()).toStrictEqual('Latest calculation')
          expect(heading.next().text().trim()).toStrictEqual('This person has no active sentences.')
          expect(heading.next().next().text().trim()).toStrictEqual(
            'To calculate release dates, you must enter active sentence information in court cases and try again.',
          )
          expect($('[data-qa=calculation-history-table]')).toHaveLength(0)
          expect($('[data-qa=historic-calc-page-summary]').eq(0).text().trim()).toStrictEqual(
            'There are no previous calculations.',
          )
        })
    })

    it('No latest calc but has some sentences', () => {
      const overview: PrisonerCalculationOverview = {
        latestCalculation: null,
        recentCalculations: [],
        totalCalculationCount: 0,
        hasIndeterminateSentences: false,
        numberOfSentences: 10,
      }
      calculateReleaseDatesService.getPrisonCalculationOverview.mockResolvedValue(overview)

      return request(app)
        .get(`/${stubbedPrisonerData.offenderNo}/overview`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = $('[data-qa=latest-calc-heading]')
          expect(heading.text().trim()).toStrictEqual('Latest calculation')
          expect(heading.next().text().trim()).toStrictEqual('There are no previous calculations.')
          expect($('[data-qa=calculation-history-table]')).toHaveLength(0)
          expect($('[data-qa=historic-calc-page-summary]').eq(0).text().trim()).toStrictEqual(
            'There are no previous calculations.',
          )
        })
    })
  })
  describe('Latest calculation summary scenarios', () => {
    it('Latest calc is normal CRDS calculation', () => {
      const overview: PrisonerCalculationOverview = {
        latestCalculation: {
          prisonerId: stubbedPrisonerData.offenderNo,
          bookingId: stubbedPrisonerData.bookingId,
          calculatedAt: '2024-03-05',
          reason: 'New Sentence',
          source: 'CRDS',
          dates: [],
          calculatedByUsername: 'user1',
          calculatedByDisplayName: 'Bob Smith',
          establishment: 'HMP ABC',
          calculationType: 'CALCULATED',
        },
        recentCalculations: [],
        totalCalculationCount: 0,
        hasIndeterminateSentences: false,
        numberOfSentences: 5,
      }
      calculateReleaseDatesService.getPrisonCalculationOverview.mockResolvedValue(overview)

      return request(app)
        .get(`/${stubbedPrisonerData.offenderNo}/overview`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('dt:contains("Calculation date")').next().text().trim()).toStrictEqual('05 March 2024')
          expect($('dt:contains("Calculation reason")').next().text().trim()).toStrictEqual('New Sentence')
          expect($('dt:contains("Calculated by")').next().text().trim()).toStrictEqual('Bob Smith at HMP ABC')
          expect($('dt:contains("Last checked by")').next().text().trim()).toStrictEqual('Not checked')
          expect($('dt:contains("Source")').next().text().trim()).toStrictEqual('Calculate release dates service')
        })
    })
    it('Latest calc is manual CRDS calculation', () => {
      const overview: PrisonerCalculationOverview = {
        latestCalculation: {
          prisonerId: stubbedPrisonerData.offenderNo,
          bookingId: stubbedPrisonerData.bookingId,
          calculatedAt: '2024-03-05',
          reason: 'New Sentence',
          source: 'CRDS',
          dates: [],
          calculatedByUsername: 'user1',
          calculatedByDisplayName: 'Bob Smith',
          establishment: 'HMP ABC',
          calculationType: 'MANUAL_DETERMINATE',
        },
        recentCalculations: [],
        totalCalculationCount: 0,
        hasIndeterminateSentences: false,
        numberOfSentences: 5,
      }
      calculateReleaseDatesService.getPrisonCalculationOverview.mockResolvedValue(overview)

      return request(app)
        .get(`/${stubbedPrisonerData.offenderNo}/overview`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('dt:contains("Calculation date")').next().text().trim()).toStrictEqual('05 March 2024')
          expect($('dt:contains("Calculation reason")').next().text().trim()).toStrictEqual('New Sentence')
          expect($('dt:contains("Calculated by")').next().text().trim()).toStrictEqual('Bob Smith at HMP ABC')
          expect($('dt:contains("Last checked by")').next().text().trim()).toStrictEqual('Not checked')
          const sourceLines = $('dt:contains("Source")')
            .next()
            .text()
            .trim()
            .split('\n')
            .filter(line => line.trim() !== '')
          expect(sourceLines[0].trim()).toStrictEqual('Paper calculation')
          expect(sourceLines[1].trim()).toStrictEqual('Entered in the Calculate release dates service')
        })
    })
    it('Latest calc is genuine override CRDS calculation', () => {
      const overview: PrisonerCalculationOverview = {
        latestCalculation: {
          prisonerId: stubbedPrisonerData.offenderNo,
          bookingId: stubbedPrisonerData.bookingId,
          calculatedAt: '2024-03-05',
          reason: 'New Sentence',
          source: 'CRDS',
          dates: [],
          calculatedByUsername: null,
          calculatedByDisplayName: null,
          establishment: 'HMP ABC',
          calculationType: 'GENUINE_OVERRIDE',
          genuineOverrideReasonDescription: 'Power to detain',
        },
        recentCalculations: [],
        totalCalculationCount: 0,
        hasIndeterminateSentences: false,
        numberOfSentences: 5,
      }
      calculateReleaseDatesService.getPrisonCalculationOverview.mockResolvedValue(overview)

      return request(app)
        .get(`/${stubbedPrisonerData.offenderNo}/overview`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('dt:contains("Calculation date")').next().text().trim()).toStrictEqual('05 March 2024')
          expect($('dt:contains("Calculation reason")').next().text().trim()).toStrictEqual('New Sentence')
          expect($('dt:contains("Calculated by")').next().text().trim()).toStrictEqual('HMP ABC')
          expect($('dt:contains("Last checked by")').next().text().trim()).toStrictEqual('Not checked')
          const sourceLines = $('dt:contains("Source")')
            .next()
            .text()
            .trim()
            .split('\n')
            .filter(line => line.trim() !== '')
          expect(sourceLines[0].trim()).toStrictEqual('User override')
          expect(sourceLines[1].trim()).toStrictEqual('Power to detain')
        })
    })

    it('Latest calc has been second checked', () => {
      const overview: PrisonerCalculationOverview = {
        latestCalculation: {
          prisonerId: stubbedPrisonerData.offenderNo,
          bookingId: stubbedPrisonerData.bookingId,
          calculatedAt: '2024-03-05',
          reason: 'New Sentence',
          source: 'CRDS',
          dates: [],
          calculatedByUsername: 'user1',
          calculatedByDisplayName: 'Bob Smith',
          establishment: 'HMP ABC',
          calculationType: 'CALCULATED',
          checkedByUsername: 'jw1',
          checkedByDisplayName: 'John Green',
          checkedAt: '2024-04-06',
        },
        recentCalculations: [],
        totalCalculationCount: 0,
        hasIndeterminateSentences: false,
        numberOfSentences: 5,
      }
      calculateReleaseDatesService.getPrisonCalculationOverview.mockResolvedValue(overview)

      return request(app)
        .get(`/${stubbedPrisonerData.offenderNo}/overview`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('dt:contains("Calculation date")').next().text().trim()).toStrictEqual('05 March 2024')
          expect($('dt:contains("Calculation reason")').next().text().trim()).toStrictEqual('New Sentence')
          expect($('dt:contains("Calculated by")').next().text().trim()).toStrictEqual('Bob Smith at HMP ABC')
          expect($('dt:contains("Last checked by")').next().text().trim()).toStrictEqual('John Green on 06 April 2024')
          expect($('dt:contains("Source")').next().text().trim()).toStrictEqual('Calculate release dates service')
        })
    })
    it('Latest calc is NOMIS calculation', () => {
      const overview: PrisonerCalculationOverview = {
        latestCalculation: {
          prisonerId: stubbedPrisonerData.offenderNo,
          bookingId: stubbedPrisonerData.bookingId,
          calculatedAt: '2024-03-05',
          reason: 'New Sentence',
          source: 'NOMIS',
          dates: [],
          calculatedByUsername: 'user1',
          calculatedByDisplayName: 'Bob Smith',
          calculationType: null,
          establishment: null,
        },
        recentCalculations: [],
        totalCalculationCount: 0,
        hasIndeterminateSentences: false,
        numberOfSentences: 5,
      }
      calculateReleaseDatesService.getPrisonCalculationOverview.mockResolvedValue(overview)

      return request(app)
        .get(`/${stubbedPrisonerData.offenderNo}/overview`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('dt:contains("Calculation date")').next().text().trim()).toStrictEqual('05 March 2024')
          expect($('dt:contains("Calculation reason")').next().text().trim()).toStrictEqual('New Sentence')
          expect($('dt:contains("Calculated by")').next().text().trim()).toStrictEqual('Bob Smith')
          expect($('dt:contains("Last checked by")').next().text().trim()).toStrictEqual('Not checked')
          expect($('dt:contains("Source")').next().text().trim()).toStrictEqual('NOMIS')
        })
    })
  })
  describe('calculation history scenarios', () => {
    const baseOverview: PrisonerCalculationOverview = {
      latestCalculation: {
        prisonerId: stubbedPrisonerData.offenderNo,
        bookingId: stubbedPrisonerData.bookingId,
        calculatedAt: '2024-03-05',
        reason: 'New Sentence',
        source: 'CRDS',
        dates: [],
        calculatedByUsername: 'user1',
        calculatedByDisplayName: 'Bob Smith',
        establishment: 'HMP ABC',
        calculationType: 'CALCULATED',
      },
      recentCalculations: [],
      totalCalculationCount: 0,
      hasIndeterminateSentences: false,
      numberOfSentences: 5,
    }

    it('Render calculation history for CRDS permutations', () => {
      calculateReleaseDatesService.getPrisonCalculationOverview.mockResolvedValue({
        ...baseOverview,
        recentCalculations: [
          {
            calculationDate: '2025-06-01',
            calculationSource: 'CRDS',
            calculationType: 'CALCULATED',
            crdsCalculationId: 123,
            reasonDescription: 'Initial calculation',
            calculatedByDisplayName: 'Fred',
            establishmentCalculatedAtDescription: 'Kirkham',
          },
          {
            calculationDate: '2025-05-23',
            calculationSource: 'CRDS',
            calculationType: 'MANUAL_DETERMINATE',
            crdsCalculationId: 456,
            reasonDescription: '14 day check',
            calculatedByDisplayName: 'Fred',
          },
          {
            calculationDate: '2025-05-13',
            calculationSource: 'CRDS',
            calculationType: 'MANUAL_INDETERMINATE',
            crdsCalculationId: 789,
            reasonDescription: 'Sentence',
            calculatedByDisplayName: 'Fred',
          },
          {
            calculationDate: '2025-04-06',
            calculationSource: 'CRDS',
            calculationType: 'GENUINE_OVERRIDE',
            crdsCalculationId: 999,
            reasonDescription: 'Reason for calculation not provided',
            calculatedByDisplayName: 'Fred',
            genuineOverrideReasonDescription: 'Terrorism',
          },
        ],
        totalCalculationCount: 10,
      })

      return request(app)
        .get(`/${stubbedPrisonerData.offenderNo}/overview`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-qa=historic-calc-page-summary]').eq(0).text().trim()).toStrictEqual('Showing 1 to 4 of 10')
          const calcHistoryTableRows = $('[data-qa=calculation-history-table]').eq(0).children('tbody').children('tr')
          expect(calcHistoryTableRows).toHaveLength(4)
          const firstRowCells = $(calcHistoryTableRows).eq(0).children('td')
          expect(firstRowCells.eq(0).text().trim()).toStrictEqual('01 June 2025')
          expect(firstRowCells.eq(0).find('a').attr('href')).toStrictEqual('/view/A1234AA/sentences-and-offences/123')
          expect(firstRowCells.eq(1).text().trim()).toStrictEqual('Initial calculation')
          expect(firstRowCells.eq(2).text().trim()).toStrictEqual('Fred at Kirkham')
          expect(firstRowCells.eq(3).text().trim()).toStrictEqual('Calculate release dates service')
          const secondRowCells = $(calcHistoryTableRows).eq(1).children('td')
          expect(secondRowCells.eq(0).text().trim()).toStrictEqual('23 May 2025')
          expect(secondRowCells.eq(0).find('a').attr('href')).toStrictEqual('/view/A1234AA/sentences-and-offences/456')
          expect(secondRowCells.eq(1).text().trim()).toStrictEqual('14 day check')
          expect(secondRowCells.eq(2).text().trim()).toStrictEqual('Fred')
          expect(secondRowCells.eq(3).html().trim()).toStrictEqual(
            'Paper calculation<br><span class="govuk-!-font-size-16 govuk-hint">Entered in the Calculate release dates service</span>',
          )
          const thirdRowCells = $(calcHistoryTableRows).eq(2).children('td')
          expect(thirdRowCells.eq(0).text().trim()).toStrictEqual('13 May 2025')
          expect(thirdRowCells.eq(0).find('a').attr('href')).toStrictEqual('/view/A1234AA/sentences-and-offences/789')
          expect(thirdRowCells.eq(1).text().trim()).toStrictEqual('Sentence')
          expect(thirdRowCells.eq(2).text().trim()).toStrictEqual('Fred')
          expect(thirdRowCells.eq(3).html().trim()).toStrictEqual(
            'Paper calculation<br><span class="govuk-!-font-size-16 govuk-hint">Entered in the Calculate release dates service</span>',
          )
          const fourthRowCells = $(calcHistoryTableRows).eq(3).children('td')
          expect(fourthRowCells.eq(0).text().trim()).toStrictEqual('06 April 2025')
          expect(fourthRowCells.eq(0).find('a').attr('href')).toStrictEqual('/view/A1234AA/sentences-and-offences/999')
          expect(fourthRowCells.eq(1).text().trim()).toStrictEqual('Reason for calculation not provided')
          expect(fourthRowCells.eq(2).text().trim()).toStrictEqual('Fred')
          expect(fourthRowCells.eq(3).html().trim()).toStrictEqual(
            'User Override<br><span class="govuk-!-font-size-16 govuk-hint">Terrorism</span>',
          )
        })
    })
    it('Render calculation history for NOMIS permutations', () => {
      calculateReleaseDatesService.getPrisonCalculationOverview.mockResolvedValue({
        ...baseOverview,
        recentCalculations: [
          {
            calculationDate: '2025-06-01',
            calculationSource: 'NOMIS',
            nomisCalculationId: 555,
            reasonDescription: 'Initial calculation',
            calculatedByDisplayName: 'Fred',
            establishmentCalculatedAtDescription: 'Kirkham',
          },
        ],
        totalCalculationCount: 10,
      })

      return request(app)
        .get(`/${stubbedPrisonerData.offenderNo}/overview`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-qa=historic-calc-page-summary]').eq(0).text().trim()).toStrictEqual('Showing 1 to 1 of 10')
          const calcHistoryTableRows = $('[data-qa=calculation-history-table]').eq(0).children('tbody').children('tr')
          expect(calcHistoryTableRows).toHaveLength(1)
          const firstRowCells = $(calcHistoryTableRows).eq(0).children('td')
          expect(firstRowCells.eq(0).text().trim()).toStrictEqual('01 June 2025')
          expect(firstRowCells.eq(0).find('a').attr('href')).toStrictEqual(
            '/view/A1234AA/nomis-calculation-summary/555',
          )
          expect(firstRowCells.eq(1).text().trim()).toStrictEqual('Initial calculation')
          expect(firstRowCells.eq(2).text().trim()).toStrictEqual('Fred at Kirkham')
          expect(firstRowCells.eq(3).text().trim()).toStrictEqual('NOMIS')
        })
    })
    it('Render calculation history when the only calculations is shown', () => {
      calculateReleaseDatesService.getPrisonCalculationOverview.mockResolvedValue({
        ...baseOverview,
        recentCalculations: [
          {
            calculationDate: '2025-06-01',
            calculationSource: 'CRDS',
            calculationType: 'CALCULATED',
            crdsCalculationId: 123,
            reasonDescription: 'Initial calculation',
            calculatedByDisplayName: 'Fred',
            establishmentCalculatedAtDescription: 'Kirkham',
          },
        ],
        totalCalculationCount: 1,
      })

      return request(app)
        .get(`/${stubbedPrisonerData.offenderNo}/overview`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-qa=historic-calc-page-summary]').eq(0).text().trim()).toStrictEqual('Showing 1 calculation')
          const calcHistoryTableRows = $('[data-qa=calculation-history-table]').eq(0).children('tbody').children('tr')
          expect(calcHistoryTableRows).toHaveLength(1)
        })
    })
    it('Render calculation history when all calculations are shown', () => {
      calculateReleaseDatesService.getPrisonCalculationOverview.mockResolvedValue({
        ...baseOverview,
        recentCalculations: [
          {
            calculationDate: '2025-06-01',
            calculationSource: 'CRDS',
            calculationType: 'CALCULATED',
            crdsCalculationId: 123,
            reasonDescription: 'Initial calculation',
            calculatedByDisplayName: 'Fred',
            establishmentCalculatedAtDescription: 'Kirkham',
          },
          {
            calculationDate: '2025-05-01',
            calculationSource: 'CRDS',
            calculationType: 'CALCULATED',
            crdsCalculationId: 456,
            reasonDescription: 'Initial calculation',
            calculatedByDisplayName: 'Fred',
            establishmentCalculatedAtDescription: 'Kirkham',
          },
        ],
        totalCalculationCount: 1,
      })

      return request(app)
        .get(`/${stubbedPrisonerData.offenderNo}/overview`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-qa=historic-calc-page-summary]').eq(0).text().trim()).toStrictEqual('Showing 2 calculations')
          const calcHistoryTableRows = $('[data-qa=calculation-history-table]').eq(0).children('tbody').children('tr')
          expect(calcHistoryTableRows).toHaveLength(2)
        })
    })
  })
})

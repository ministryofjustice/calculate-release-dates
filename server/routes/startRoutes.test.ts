import request from 'supertest'
import type { Express } from 'express'
import * as cheerio from 'cheerio'
import { Action, LatestCalculationCardConfig } from 'hmpps-court-cases-release-dates-design/hmpps/@types'
import { appWithAllRoutes, user } from './testutils/appSetup'
import PrisonerService from '../services/prisonerService'
import {
  PrisonAPIAssignedLivingUnit,
  PrisonApiPrisoner,
  PrisonApiSentenceDetail,
} from '../@types/prisonApi/prisonClientTypes'
import UserPermissionsService from '../services/userPermissionsService'
import {
  expectMiniProfile,
  expectNoMiniProfile,
  expectServiceHeader,
  expectServiceHeaderForPrisoner,
} from './testutils/layoutExpectations'
import AuthorisedRoles from '../enumerations/authorisedRoles'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import { HistoricCalculation } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { FullPageError } from '../types/FullPageError'

jest.mock('../services/calculateReleaseDatesService')
jest.mock('../services/prisonerService')
jest.mock('../services/userPermissionsService')

const calculateReleaseDatesService = new CalculateReleaseDatesService() as jest.Mocked<CalculateReleaseDatesService>
const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const userPermissionsService = new UserPermissionsService() as jest.Mocked<UserPermissionsService>
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

const nomisCalculationHistory = [
  {
    offenderNo: 'GU32342',
    calculationDate: '2024-03-05',
    calculationSource: 'NOMIS',
    commentText: 'a calculation',
    calculationType: 'CALCULATED',
    establishment: 'Kirkham (HMP)',
    calculationRequestId: 90328,
    calculationReason: 'New Sentence',
    offenderSentCalculationId: 123456,
  },
] as HistoricCalculation[]

const calculationHistory = [
  {
    offenderNo: 'GU32342',
    calculationDate: '2024-03-05',
    calculationSource: 'CRDS',
    commentText: 'a calculation',
    calculationType: 'CALCULATED',
    establishment: 'Kirkham (HMP)',
    calculationRequestId: 90328,
    calculationReason: 'New Sentence',
  },
  {
    offenderNo: 'MJ93022',
    calculationDate: '2021-09-27',
    calculationSource: 'CRDS',
    commentText: 'calculation without reason',
    calculationType: 'CALCULATED',
    establishment: 'Five Wells (HMP)',
    calculationRequestId: 849432,
    calculationReason: null,
  },
] as HistoricCalculation[]

const latestCalcCardForPrisoner: LatestCalculationCardConfig = {
  reason: 'Initial check',
  calculatedAt: '2025-02-01T10:30:00',
  source: 'CRDS',
  establishment: 'Kirkham (HMP)',
  dates: [
    { date: '2024-02-21', type: 'CRD', description: 'Conditional release date', hints: [] },
    { date: '2024-06-15', type: 'SLED', description: 'Sentence and licence expiry date', hints: [] },
  ],
}
const latestCalcCardActionForPrisoner: Action = {
  title: 'View details',
  href: '/foo',
  dataQa: 'latest-calc-card-action',
}
const noLatestCalcCard = {
  latestCalcCard: undefined,
  latestCalcCardAction: undefined,
}

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: { calculateReleaseDatesService, prisonerService, userPermissionsService },
    userSupplier: () => {
      return { ...user, userRoles: [AuthorisedRoles.ROLE_RELEASE_DATES_CALCULATOR, 'ROLE_ADJUSTMENTS_MAINTAINER'] }
    },
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

    const routes = [{ method: 'GET', url: '?prisonId=123' }]

    await runTest(routes)
  })
})

describe('Start routes tests', () => {
  it('GET / should render the search page', async () => {
    let redirect: string
    await request(app)
      .get('/')
      .expect(302)
      .expect('Location', '/search/prisoners')
      .expect(res => {
        redirect = res.headers.location
      })

    await request(app)
      .get(redirect)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expectNoMiniProfile(res.text)
        expectServiceHeader(res.text)
        expect($('.govuk-phase-banner__content__tag').length).toStrictEqual(0)
      })
  })

  it('should render correct links for prisoner with no Indeterminate sentences', async () => {
    calculateReleaseDatesService.getCalculationHistory.mockResolvedValue(nomisCalculationHistory)
    const cardAndAction = {
      latestCalcCard: latestCalcCardForPrisoner,
    }
    calculateReleaseDatesService.getLatestCalculationCardForPrisoner.mockResolvedValue(cardAndAction)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.hasIndeterminateSentences.mockResolvedValue(false)
    await request(app)
      .get('?prisonId=123')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const addDatesFlowLink = $('[data-qa=calc-release-dates-for-adding-dates-link]').first()
        expect($('.govuk-link').first().attr('href')).toStrictEqual('/view/GU32342/nomis-calculation-summary/123456')
        expect(addDatesFlowLink.attr('href')).toStrictEqual('/calculation/A1234AA/reason?isAddDatesFlow=true')
        expect(addDatesFlowLink.text()).toStrictEqual('Add APD, HDCAD or ROTL dates')
      })
  })

  it('should render correct links for prisoner with Indeterminate sentences', async () => {
    calculateReleaseDatesService.getCalculationHistory.mockResolvedValue(nomisCalculationHistory)
    const cardAndAction = {
      latestCalcCard: latestCalcCardForPrisoner,
    }
    calculateReleaseDatesService.getLatestCalculationCardForPrisoner.mockResolvedValue(cardAndAction)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.hasIndeterminateSentences.mockResolvedValue(true)
    await request(app)
      .get('?prisonId=123')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const calculateDatesFlowLink = $('[data-qa=calc-release-dates-for-prisoner-action-link]').first()
        expect(calculateDatesFlowLink.attr('href')).toStrictEqual('/calculation/A1234AA/reason')
        const addDatesFlowLink = $('[data-qa=calc-release-dates-for-adding-dates-link]').first()
        expect(addDatesFlowLink.length).toStrictEqual(0)
      })
  })

  it('GET ?prisonId=123 if CCARD feature toggle is on and user has CRD and adjustments then show all CCARD nav', () => {
    userPermissionsService.allowBulkLoad.mockReturnValue(true)
    calculateReleaseDatesService.getCalculationHistory.mockResolvedValue(calculationHistory)
    const cardAndAction = {
      latestCalcCard: latestCalcCardForPrisoner,
      latestCalcCardAction: latestCalcCardActionForPrisoner,
    }
    calculateReleaseDatesService.getLatestCalculationCardForPrisoner.mockResolvedValue(cardAndAction)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .get('?prisonId=123')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-qa=main-heading]').text()).toStrictEqual('Release dates and calculations')
        expectMiniProfile(res.text, {
          name: 'Nobody, Anon',
          dob: '24/06/2000',
          prisonNumber: 'A1234AA',
          establishment: 'Foo Prison (HMP)',
          location: 'D-2-003',
          status: 'Serving Life Imprisonment',
        })
        expectServiceHeaderForPrisoner(res.text, 'A1234AA')
        expect($('.govuk-phase-banner__content__tag').length).toStrictEqual(0)
        expect($('[data-qa=calc-release-dates-for-prisoner-action-link]').attr('href')).toStrictEqual(
          '/calculation/A1234AA/reason',
        )
        expect($('[data-qa=calculation-history-table]').length).toStrictEqual(1)
        const calculationHistoryHeadings = $('[data-qa=calculation-history-table-headings] th')
          .map((i, element) => $(element).text())
          .get()
        expect(calculationHistoryHeadings).toStrictEqual([
          'Calculation date',
          'Calculation reason',
          'Establishment',
          'Source',
        ])
        const calculationHistoryRow1 = $('[data-qa=calculation-history-table-data-1] td')
          .map((i, element) => $(element).text())
          .get()
        expect(calculationHistoryRow1).toStrictEqual([
          '05 March 2024',
          'New Sentence',
          'Kirkham (HMP)',
          'Calculate release dates service',
        ])
        const calculationHistoryRow2 = $('[data-qa=calculation-history-table-data-2] td')
          .map((i, element) => $(element).text())
          .get()
        expect(calculationHistoryRow2).toStrictEqual([
          '27 September 2021',
          'Not entered',
          'Five Wells (HMP)',
          'Calculate release dates service',
        ])
        const latestValuationSLEDRow = $('[data-qa=latest-calculation-card-release-date-SLED]').first()
        expect(latestValuationSLEDRow).toBeTruthy()
        const latestValuationCRDRow = $('[data-qa=latest-calculation-card-release-date-CRD]').first()
        expect(latestValuationCRDRow).toBeTruthy()

        expect(res.text).toContain('href="/view/GU32342/sentences-and-offences/90328')
        const links = $('.moj-sub-navigation__link')
          .filter((index, element) => $(element).attr('href').length > 0) // filter hidden links
          .map((i, element) => {
            return $(element).text()
          })
          .get()
        expect(links).toStrictEqual(['Overview', 'Adjustments', 'Release dates and calculations'])
      })
  })
  it('GET ?prisonId=123 CCARD mode should not blow up if latest calc cannot be loaded', () => {
    userPermissionsService.allowBulkLoad.mockReturnValue(true)

    calculateReleaseDatesService.getCalculationHistory.mockResolvedValue(calculationHistory)
    const cardAndAction = { latestCalcCard: undefined, latestCalcCardAction: undefined }
    calculateReleaseDatesService.getLatestCalculationCardForPrisoner.mockResolvedValue(cardAndAction)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .get('?prisonId=123')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('.release-dates-list')).toHaveLength(0)
      })
  })

  it('GET ?prisonId=123 if CCARD feature toggle is on and offender has no calculation history', () => {
    userPermissionsService.allowBulkLoad.mockReturnValue(true)

    calculateReleaseDatesService.getCalculationHistory.mockResolvedValue([])
    calculateReleaseDatesService.getLatestCalculationCardForPrisoner.mockResolvedValue(noLatestCalcCard)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .get('?prisonId=123')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-qa=calculation-history-table]').length).toStrictEqual(0)
      })
  })

  it('GET ?prisonId=123 if user has CRD only then hide service banner and sub nav', () => {
    app = appWithAllRoutes({
      services: { calculateReleaseDatesService, prisonerService, userPermissionsService },
      userSupplier: () => {
        return { ...user, userRoles: [AuthorisedRoles.ROLE_RELEASE_DATES_CALCULATOR] }
      },
    })

    userPermissionsService.allowBulkLoad.mockReturnValue(true)

    calculateReleaseDatesService.getCalculationHistory.mockResolvedValue(calculationHistory)
    calculateReleaseDatesService.getLatestCalculationCardForPrisoner.mockResolvedValue(noLatestCalcCard)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .get('?prisonId=123')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-qa=main-heading]').text()).toStrictEqual('Release dates and calculations')
        expectMiniProfile(res.text, {
          name: 'Nobody, Anon',
          dob: '24/06/2000',
          prisonNumber: 'A1234AA',
          establishment: 'Foo Prison (HMP)',
          location: 'D-2-003',
          status: 'Serving Life Imprisonment',
        })
        expect($('.service-header').length).toStrictEqual(0)
        expect($('.govuk-phase-banner__content__tag').length).toStrictEqual(0)
        expect($('[data-qa=calc-release-dates-for-prisoner-action-link]').attr('href')).toStrictEqual(
          '/calculation/A1234AA/reason',
        )
        expect($('[data-qa=bulk-comparison-action-link]').attr('href')).toStrictEqual('/compare')
        expect($('.moj-sub-navigation__link').length).toStrictEqual(0)
      })
  })

  it('GET ?prisonId=123 if CCARD feature is on does not have bulk comparison action link if user does not have comparison role', () => {
    app = appWithAllRoutes({
      services: { calculateReleaseDatesService, prisonerService, userPermissionsService },
      userSupplier: () => {
        return { ...user, userRoles: [AuthorisedRoles.ROLE_RELEASE_DATES_CALCULATOR] }
      },
    })

    userPermissionsService.allowBulkLoad.mockReturnValue(false)

    calculateReleaseDatesService.getCalculationHistory.mockResolvedValue(calculationHistory)
    calculateReleaseDatesService.getLatestCalculationCardForPrisoner.mockResolvedValue(noLatestCalcCard)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .get('?prisonId=123')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-qa=calc-release-dates-for-prisoner-action-link]').attr('href')).toStrictEqual(
          '/calculation/A1234AA/reason',
        )
        expect($('[data-qa=bulk-comparison-action-link]').length).toStrictEqual(0)
        expect($('.moj-sub-navigation__link').length).toStrictEqual(0)
      })
  })

  it('GET if the user does not have the ROLE_COURTCASE_RELEASEDATE_SUPPORT role the config link is not present', () => {
    userPermissionsService.allowNomisReadOnlyScreensConfigurationAccess.mockReturnValue(false)

    calculateReleaseDatesService.getCalculationHistory.mockResolvedValue(calculationHistory)
    calculateReleaseDatesService.getLatestCalculationCardForPrisoner.mockResolvedValue(noLatestCalcCard)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .get('?prisonId=123')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-qa=configure-nomis-screens-action-link]').contents().text()).not.toContain(
          'Configure Nomis Screens',
        )
        expect($('[data-qa=configure-nomis-screens-action-link]').length).toStrictEqual(0)
      })
  })

  it('GET if the user does has the ROLE_COURTCASE_RELEASEDATE_SUPPORT role the config link is present', () => {
    userPermissionsService.allowNomisReadOnlyScreensConfigurationAccess.mockReturnValue(true)

    calculateReleaseDatesService.getCalculationHistory.mockResolvedValue(calculationHistory)
    calculateReleaseDatesService.getLatestCalculationCardForPrisoner.mockResolvedValue(noLatestCalcCard)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .get('?prisonId=123')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-qa=configure-nomis-screens-action-link]').contents().text()).toStrictEqual(
          'Configure Nomis Screens',
        )
        expect($('[data-qa=configure-nomis-screens-action-link]').length).toStrictEqual(1)
      })
  })

  it('GET /supported-sentences/ASD123 should return the supported sentence page', () => {
    return request(app)
      .get('/supported-sentences/ASD123')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Supported sentences')
        expect(res.text).toContain(
          'The Calculate release dates service supports CJA (Criminal Justice Act) 2003 and 2020 sentences only. The sentences currently supported are:',
        )
        expect(res.text).toContain('href="/calculation/ASD123/check-information?hasErrors=true')
      })
  })

  describe('sub-nav tests in relation to prisoner being OUT or TRN', () => {
    it('Do not show adjustments sub-nav link if prisoner is OUT', () => {
      userPermissionsService.allowBulkLoad.mockReturnValue(true)
      calculateReleaseDatesService.getCalculationHistory.mockResolvedValue(calculationHistory)
      const cardAndAction = {
        latestCalcCard: latestCalcCardForPrisoner,
        latestCalcCardAction: latestCalcCardActionForPrisoner,
      }
      calculateReleaseDatesService.getLatestCalculationCardForPrisoner.mockResolvedValue(cardAndAction)
      prisonerService.getPrisonerDetail.mockResolvedValue({ ...stubbedPrisonerData, agencyId: 'OUT' })

      return request(app)
        .get('?prisonId=123')
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const text = $('[data-qa=personOutsideBanner]').text().replace(/\s\s+/g, ' ').trim() // Remove space
          expect(text).toBe('This person has been released Some information may be hidden')
          const links = $('.moj-sub-navigation__link')
            .filter((index, element) => $(element).attr('href').length > 0) // filter hidden links
            .map((i, element) => {
              return $(element).text()
            })
            .get()
          expect(links).toStrictEqual(['Overview', 'Release dates and calculations'])
        })
    })

    it('Do not show adjustments sub-nav link if prisoner is TRN', () => {
      userPermissionsService.allowBulkLoad.mockReturnValue(true)
      calculateReleaseDatesService.getCalculationHistory.mockResolvedValue(calculationHistory)
      const cardAndAction = {
        latestCalcCard: latestCalcCardForPrisoner,
        latestCalcCardAction: latestCalcCardActionForPrisoner,
      }
      calculateReleaseDatesService.getLatestCalculationCardForPrisoner.mockResolvedValue(cardAndAction)
      prisonerService.getPrisonerDetail.mockResolvedValue({ ...stubbedPrisonerData, agencyId: 'TRN' })

      return request(app)
        .get('?prisonId=123')
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const text = $('[data-qa=personTransferredBanner]').text().replace(/\s\s+/g, ' ').trim() // Remove space
          expect(text).toBe('This person has been transferred Some information may be hidden')
          const links = $('.moj-sub-navigation__link')
            .filter((index, element) => $(element).attr('href').length > 0) // filter hidden links
            .map((i, element) => {
              return $(element).text()
            })
            .get()
          expect(links).toStrictEqual(['Overview', 'Release dates and calculations'])
        })
    })

    it('Do show adjustments sub-nav link if prisoner neither OUT or TRN', () => {
      userPermissionsService.allowBulkLoad.mockReturnValue(true)
      calculateReleaseDatesService.getCalculationHistory.mockResolvedValue(calculationHistory)
      const cardAndAction = {
        latestCalcCard: latestCalcCardForPrisoner,
        latestCalcCardAction: latestCalcCardActionForPrisoner,
      }
      calculateReleaseDatesService.getLatestCalculationCardForPrisoner.mockResolvedValue(cardAndAction)
      prisonerService.getPrisonerDetail.mockResolvedValue({ ...stubbedPrisonerData, agencyId: 'MDI' })

      return request(app)
        .get('?prisonId=123')
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const links = $('.moj-sub-navigation__link')
            .filter((index, element) => $(element).attr('href').length > 0) // filter hidden links
            .map((i, element) => {
              return $(element).text()
            })
            .get()
          expect(links).toStrictEqual(['Overview', 'Adjustments', 'Release dates and calculations'])
        })
    })
  })
})

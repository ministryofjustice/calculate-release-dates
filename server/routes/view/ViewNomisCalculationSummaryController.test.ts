import request from 'supertest'
import type { Express } from 'express'
import * as cheerio from 'cheerio'
import PrisonerService from '../../services/prisonerService'
import UserService from '../../services/userService'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import ViewReleaseDatesService from '../../services/viewReleaseDatesService'
import AuditService from '../../services/auditService'
import { appWithAllRoutes } from '../testutils/appSetup'
import {
  PrisonAPIAssignedLivingUnit,
  PrisonApiPrisoner,
  PrisonApiSentenceDetail,
} from '../../@types/prisonApi/prisonClientTypes'

jest.mock('../../services/userService')
jest.mock('../../services/calculateReleaseDatesService')
jest.mock('../../services/prisonerService')
jest.mock('../../services/viewReleaseDatesService')
jest.mock('../../services/auditService')

const prisonerService = new PrisonerService(null, null) as jest.Mocked<PrisonerService>
const userService = new UserService(null, prisonerService) as jest.Mocked<UserService>
const auditService = new AuditService() as jest.Mocked<AuditService>
const calculateReleaseDatesService = new CalculateReleaseDatesService(
  auditService,
  null,
) as jest.Mocked<CalculateReleaseDatesService>
const viewReleaseDatesService = new ViewReleaseDatesService(null) as jest.Mocked<ViewReleaseDatesService>

let app: Express

const pastNomisCalculation = {
  calculatedAt: '2022-01-01T00:00:00Z',
  reason: 'Some reason',
  prisonerDetail: {
    locationDescription: 'Inside - Leeds HMP',
  },
  calculatedByDisplayName: 'Bob Smith',
  releaseDates: [
    {
      type: 'HDCED',
      description: 'Home detention curfew eligibility date',
      date: '2024-05-12',
      hints: [
        {
          text: 'Friday, 10 May 2024 when adjusted to a working day',
        },
      ],
    },
  ],
}

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

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      prisonerService,
      userService,
      calculateReleaseDatesService,
      viewReleaseDatesService,
      auditService,
    },
  })
})

describe('View NOMIS calculation summary controller tests', () => {
  describe('Profile banner tests - relating to persons that are OUT or not', () => {
    it('GET /view/:nomsId/nomis-calculation-summary/:offenderSentCalculationId should show personOutsideBanner when prisoner is OUT', () => {
      prisonerService.getPrisonerDetail.mockResolvedValue({ ...stubbedPrisonerData, agencyId: 'OUT' })
      calculateReleaseDatesService.getNomisCalculationSummary.mockResolvedValue(pastNomisCalculation as never)

      return request(app)
        .get('/view/A1234AA/nomis-calculation-summary/-1')
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const text = $('[data-qa=personOutsideBanner]').text().replace(/\s\s+/g, ' ').trim()
          expect(text).toBe('This person has been released Some information may be hidden')
        })
    })

    it('GET /view/:nomsId/nomis-calculation-summary/:offenderSentCalculationId should show personOutsideBanner when prisoner is TRN', () => {
      prisonerService.getPrisonerDetail.mockResolvedValue({ ...stubbedPrisonerData, agencyId: 'TRN' })
      calculateReleaseDatesService.getNomisCalculationSummary.mockResolvedValue(pastNomisCalculation as never)

      return request(app)
        .get('/view/A1234AA/nomis-calculation-summary/-1')
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const text = $('[data-qa=personTransferredBanner]').text().replace(/\s\s+/g, ' ').trim()
          expect(text).toBe('This person has been transferred Some information may be hidden')
        })
    })

    it('GET /view/:nomsId/nomis-calculation-summary/:offenderSentCalculationId should not show personOutsideBanner when prisoner is OUT', () => {
      prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      calculateReleaseDatesService.getNomisCalculationSummary.mockResolvedValue(pastNomisCalculation as never)

      return request(app)
        .get('/view/A1234AA/nomis-calculation-summary/-1')
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-qa=personOutsideBanner]').length).toBe(0)
        })
    })
  })

  describe('Get nomis calculation summary view tests', () => {
    it('GET /view/:nomsId/nomis-calculation-summary/:offenderSentCalculationId should have the correct details', () => {
      prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      calculateReleaseDatesService.getNomisCalculationSummary.mockResolvedValue(pastNomisCalculation as never)
      return request(app)
        .get('/view/A1234AA/nomis-calculation-summary/-1')
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-qa=calculation-title]').text()).toStrictEqual('Calculation details')
          expect($('[data-qa=calculation-date]').text()).toStrictEqual('01 January 2022')
          expect($('[data-qa=calculation-reason]').text()).toStrictEqual('Some reason')
          expect($('[data-qa=calculated-by]').text()).toStrictEqual('Bob Smith')
          expect($('[data-qa=calculation-source]').text().trim()).toStrictEqual('NOMIS')
          expect($('[data-qa=calculation-date-title]').text()).toStrictEqual('Date of calculation')
          expect($('[data-qa=calculation-reason-title]').text()).toStrictEqual('Reason')
          expect($('[data-qa=calculated-by-title]').text()).toStrictEqual('Calculated by')
          expect($('[data-qa=calculation-source-title]').text()).toStrictEqual('Source')
          expect($('[data-qa=HDCED-date]').text().trim()).toContain('Sunday, 12 May 2024')
          expect($('[data-qa=HDCED-short-name]').text().trim()).toContain('HDCED')
          expect($('[data-qa=HDCED-full-name]').text().trim()).toStrictEqual('Home detention curfew eligibility date')
          expect($('[data-qa=mini-profile-prisoner-number]').text().trim()).toStrictEqual('A1234AA')
          expect($('[data-qa=HDCED-release-date-hint-0]').text()).toStrictEqual(
            'Friday, 10 May 2024 when adjusted to a working day',
          )
        })
    })

    it('GET /view/:nomsId/nomis-calculation-summary/:offenderSentCalculationId should show correct hint text with link when it relates to HDC policy', () => {
      prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      calculateReleaseDatesService.getNomisCalculationSummary.mockResolvedValue({
        ...pastNomisCalculation,
        releaseDates: pastNomisCalculation.releaseDates.map(releaseDate => ({
          ...releaseDate,
          hints: [
            {
              text: 'New hint text here with HDC policy',
              link: 'https://example.com',
            },
          ],
        })),
      } as never)

      return request(app)
        .get('/view/A1234AA/nomis-calculation-summary/-1')
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-qa=HDCED-release-date-hint-0]').text()).toStrictEqual('HDC policy')
          expect($('[data-qa=HDCED-release-date-hint-0]').first().attr('href')).toStrictEqual('https://example.com')
        })
    })
  })
})

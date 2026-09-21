import request from 'supertest'
import type { Express } from 'express'
import * as cheerio from 'cheerio'
import PrisonerService from '../../services/prisonerService'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import { appWithAllRoutes } from '../testutils/appSetup'
import {
  AdjustmentDto,
  DetailedCalculationResults,
  HistoricCalculationSummaryPage,
} from '../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { PrisonAPIAssignedLivingUnit, PrisonApiPrisoner } from '../../@types/prisonApi/prisonClientTypes'

jest.mock('../../services/prisonerService')
jest.mock('../../services/viewReleaseDatesService')
jest.mock('../../services/calculateReleaseDatesService')

const prisonerService = new PrisonerService(null, null) as jest.Mocked<PrisonerService>
const calculateReleaseDatesService = new CalculateReleaseDatesService(
  null,
  null,
) as jest.Mocked<CalculateReleaseDatesService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      prisonerService,
      calculateReleaseDatesService,
    },
  })
})

describe('View calculation history overview', () => {
  describe('History side nav tests', () => {
    it('Should show all items if less than 10 in the page and no older or newer link when the latest calculation is selected', () => {
      calculateReleaseDatesService.getDetailedCalculationResults.mockResolvedValue(stubbedDetailedCalculationResults)
      calculateReleaseDatesService.getCalculationHistoryPage.mockResolvedValue({
        items: [
          stubbedFullPageOfCalculationHistory.items[0], // currently selected
          stubbedFullPageOfCalculationHistory.items[1], // nomis
          stubbedFullPageOfCalculationHistory.items[2], // another CRDS
        ],
        page: {
          pageNumber: 1,
          totalPages: 1,
          totalItems: 3,
        },
      })
      prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      return request(app)
        .get('/view/A1234AA/calculation-history/CRDS/123456/overview')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const sideNavItems = $('.moj-side-navigation__item')
          expect(sideNavItems).toHaveLength(3)
          expect(sideNavItems.eq(0).text()).toContain('30 June 2025')
          expect(sideNavItems.eq(0).text()).toContain('Latest')
          expect(sideNavItems.eq(0).find('a').attr('href')).toStrictEqual(
            '/view/A1234AA/calculation-history/CRDS/123456/overview?page=1',
          )
          expect(sideNavItems.eq(0).hasClass('moj-side-navigation__item--active')).toStrictEqual(true)

          expect(sideNavItems.eq(1).text()).toContain('29 June 2025')
          expect(sideNavItems.eq(1).find('a').attr('href')).toStrictEqual(
            '/view/A1234AA/calculation-history/NOMIS/9999929/overview?page=1',
          )
          expect(sideNavItems.eq(1).hasClass('moj-side-navigation__item--active')).toStrictEqual(false)

          expect(sideNavItems.eq(2).text()).toContain('28 June 2025')
          expect(sideNavItems.eq(2).find('a').attr('href')).toStrictEqual(
            '/view/A1234AA/calculation-history/CRDS/28/overview?page=1',
          )
          expect(sideNavItems.eq(2).hasClass('moj-side-navigation__item--active')).toStrictEqual(false)

          expect($('[data-qa=current-items-hint]').eq(0).text().trim()).toStrictEqual('Showing 1 to 3 of 3')
          expect($('[data-qa=older-calculations-link]')).toHaveLength(0)
          expect($('[data-qa=newer-calculations-link]')).toHaveLength(0)
        })
    })
    it('Should show all items if less than 10 in the page and no older or newer link when the selected calculation is not the latest', () => {
      calculateReleaseDatesService.getDetailedCalculationResults.mockResolvedValue(stubbedDetailedCalculationResults)
      calculateReleaseDatesService.getCalculationHistoryPage.mockResolvedValue({
        items: [
          stubbedFullPageOfCalculationHistory.items[3], // latest
          {
            ...stubbedFullPageOfCalculationHistory.items[4],
            crdsCalculationId: stubbedDetailedCalculationResults.context.calculationRequestId,
          }, // selected
          stubbedFullPageOfCalculationHistory.items[5], // another CRDS
        ],
        page: {
          pageNumber: 1,
          totalPages: 1,
          totalItems: 3,
        },
      })
      prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      return request(app)
        .get('/view/A1234AA/calculation-history/CRDS/123456/overview')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const sideNavItems = $('.moj-side-navigation__item')
          expect(sideNavItems).toHaveLength(3)
          expect(sideNavItems.eq(0).text()).toContain('27 June 2025')
          expect(sideNavItems.eq(0).text()).toContain('Latest')
          expect(sideNavItems.eq(0).find('a').attr('href')).toStrictEqual(
            '/view/A1234AA/calculation-history/CRDS/27/overview?page=1',
          )
          expect(sideNavItems.eq(0).hasClass('moj-side-navigation__item--active')).toStrictEqual(false)

          expect(sideNavItems.eq(1).text()).toContain('26 June 2025')
          expect(sideNavItems.eq(1).find('a').attr('href')).toStrictEqual(
            '/view/A1234AA/calculation-history/CRDS/123456/overview?page=1',
          )
          expect(sideNavItems.eq(1).hasClass('moj-side-navigation__item--active')).toStrictEqual(true)

          expect(sideNavItems.eq(2).text()).toContain('25 June 2025')
          expect(sideNavItems.eq(2).find('a').attr('href')).toStrictEqual(
            '/view/A1234AA/calculation-history/CRDS/25/overview?page=1',
          )
          expect(sideNavItems.eq(2).hasClass('moj-side-navigation__item--active')).toStrictEqual(false)

          expect($('[data-qa=current-items-hint]').eq(0).text().trim()).toStrictEqual('Showing 1 to 3 of 3')
          expect($('[data-qa=older-calculations-link]')).toHaveLength(0)
          expect($('[data-qa=newer-calculations-link]')).toHaveLength(0)
        })
    })
    it('Should show all items exactly 10 in the page and no older or newer link', () => {
      calculateReleaseDatesService.getDetailedCalculationResults.mockResolvedValue(stubbedDetailedCalculationResults)
      calculateReleaseDatesService.getCalculationHistoryPage.mockResolvedValue({
        items: stubbedFullPageOfCalculationHistory.items,
        page: {
          pageNumber: 1,
          totalPages: 1,
          totalItems: 10,
        },
      })
      prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      return request(app)
        .get('/view/A1234AA/calculation-history/CRDS/123456/overview')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const sideNavItems = $('.moj-side-navigation__item')
          expect(sideNavItems).toHaveLength(10)

          expect($('[data-qa=current-items-hint]').eq(0).text().trim()).toStrictEqual('Showing 1 to 10 of 10')
          expect($('[data-qa=older-calculations-link]')).toHaveLength(0)
          expect($('[data-qa=newer-calculations-link]')).toHaveLength(0)
        })
    })
    it('Should show next page link when there is more than one page remaining', () => {
      calculateReleaseDatesService.getDetailedCalculationResults.mockResolvedValue(stubbedDetailedCalculationResults)
      calculateReleaseDatesService.getCalculationHistoryPage.mockResolvedValue({
        items: stubbedFullPageOfCalculationHistory.items,
        page: {
          pageNumber: 1,
          totalPages: 3,
          totalItems: 27,
        },
      })
      prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      return request(app)
        .get('/view/A1234AA/calculation-history/CRDS/123456/overview')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const sideNavItems = $('.moj-side-navigation__item')
          expect(sideNavItems).toHaveLength(10)

          expect($('[data-qa=current-items-hint]').eq(0).text().trim()).toStrictEqual('Showing 1 to 10 of 27')
          const olderCalculationsLink = $('[data-qa=older-calculations-link]')
          expect(olderCalculationsLink).toHaveLength(1)
          expect(olderCalculationsLink.text()).toContain('Older calculations')
          expect(olderCalculationsLink.text()).toContain('11 to 20 of 27')
          expect($('[data-qa=newer-calculations-link]')).toHaveLength(0)
        })
    })
    it('Should show next and previous page links when there is are results in both directions', () => {
      calculateReleaseDatesService.getDetailedCalculationResults.mockResolvedValue(stubbedDetailedCalculationResults)
      calculateReleaseDatesService.getCalculationHistoryPage.mockResolvedValue({
        items: stubbedFullPageOfCalculationHistory.items,
        page: {
          pageNumber: 2,
          totalPages: 3,
          totalItems: 27,
        },
      })
      prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      return request(app)
        .get('/view/A1234AA/calculation-history/CRDS/123456/overview')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const sideNavItems = $('.moj-side-navigation__item')
          expect(sideNavItems).toHaveLength(10)
          expect(sideNavItems.eq(0).text()).not.toContain('Latest') // second page so not the latest calculation

          expect($('[data-qa=current-items-hint]').eq(0).text().trim()).toStrictEqual('Showing 11 to 20 of 27')
          const olderCalculationsLink = $('[data-qa=older-calculations-link]')
          expect(olderCalculationsLink).toHaveLength(1)
          expect(olderCalculationsLink.text()).toContain('Older calculations')
          expect(olderCalculationsLink.text()).toContain('21 to 27 of 27')
          const newerCalculationsLink = $('[data-qa=newer-calculations-link]')
          expect(newerCalculationsLink).toHaveLength(1)
          expect(newerCalculationsLink.text()).toContain('Newer calculations')
          expect(newerCalculationsLink.text()).toContain('1 to 10 of 27')
        })
    })
    it('Should show a final page with less than 10 items and newer items link', () => {
      calculateReleaseDatesService.getDetailedCalculationResults.mockResolvedValue(stubbedDetailedCalculationResults)
      calculateReleaseDatesService.getCalculationHistoryPage.mockResolvedValue({
        items: [
          stubbedFullPageOfCalculationHistory.items[0],
          stubbedFullPageOfCalculationHistory.items[1],
          stubbedFullPageOfCalculationHistory.items[2],
        ],
        page: {
          pageNumber: 2,
          totalPages: 2,
          totalItems: 13,
        },
      })
      prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      return request(app)
        .get('/view/A1234AA/calculation-history/CRDS/123456/overview')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const sideNavItems = $('.moj-side-navigation__item')
          expect(sideNavItems).toHaveLength(3)

          expect($('[data-qa=current-items-hint]').eq(0).text().trim()).toStrictEqual('Showing 11 to 13 of 13')
          expect($('[data-qa=older-calculations-link]')).toHaveLength(0)
          const newerCalculationsLink = $('[data-qa=newer-calculations-link]')
          expect(newerCalculationsLink).toHaveLength(1)
          expect(newerCalculationsLink.text()).toContain('Newer calculations')
          expect(newerCalculationsLink.text()).toContain('1 to 10 of 13')
        })
    })
  })

  describe('calculation metadata tests', () => {
    it('Should show the calculation metadata for a simple CRDS calculation', () => {
      calculateReleaseDatesService.getDetailedCalculationResults.mockResolvedValue(stubbedDetailedCalculationResults)
      calculateReleaseDatesService.getCalculationHistoryPage.mockResolvedValue(stubbedFullPageOfCalculationHistory)
      prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      return request(app)
        .get('/view/A1234AA/calculation-history/CRDS/123456/overview')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-qa=metadata-calculation-reason]').text().trim()).toStrictEqual('A calculation reason')
          expect($('[data-qa=metadata-calculation-reason-further-detail]')).toHaveLength(0)
          expect($('[data-qa=metadata-calculated-by]').text().trim()).toStrictEqual('User One at HMP Brixham')
          expect($('[data-qa=metadata-checked-by]').text().trim()).toStrictEqual('Not checked')
        })
    })
    it('Should show the calculation metadata for a CRDS calculation with full metadata', () => {
      calculateReleaseDatesService.getDetailedCalculationResults.mockResolvedValue({
        ...stubbedDetailedCalculationResults,
        context: {
          ...stubbedDetailedCalculationResults.context,
          otherReasonDescription: 'Some more details',
        },
        secondCheckDetails: {
          checkedByDisplayName: 'Fred',
          checkedAt: '2026-06-01',
        },
      })
      calculateReleaseDatesService.getCalculationHistoryPage.mockResolvedValue(stubbedFullPageOfCalculationHistory)
      prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      return request(app)
        .get('/view/A1234AA/calculation-history/CRDS/123456/overview')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-qa=metadata-calculation-reason]').text().trim()).toStrictEqual('A calculation reason')
          expect($('[data-qa=metadata-calculation-reason-further-detail]').text().trim()).toStrictEqual(
            'Some more details',
          )
          expect($('[data-qa=metadata-calculated-by]').text().trim()).toStrictEqual('User One at HMP Brixham')
          expect($('[data-qa=metadata-checked-by]').text().trim()).toStrictEqual('Fred on 01 June 2026')
        })
    })
    it.each([
      ['User One', 'HMP Brixham', 'User One at HMP Brixham'],
      ['User One', null, 'User One'],
      [null, 'HMP Brixham', 'HMP Brixham'],
    ])(
      'Should show the calculated by correctly for combinations of available fields on a CRDS calculation',
      (calculatedByDisplayName: string, calculatedAtPrisonDescription: string, expected: string) => {
        calculateReleaseDatesService.getDetailedCalculationResults.mockResolvedValue({
          ...stubbedDetailedCalculationResults,
          context: {
            ...stubbedDetailedCalculationResults.context,
            calculatedByDisplayName,
            calculatedAtPrisonDescription,
          },
        })
        calculateReleaseDatesService.getCalculationHistoryPage.mockResolvedValue(stubbedFullPageOfCalculationHistory)
        prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
        return request(app)
          .get('/view/A1234AA/calculation-history/CRDS/123456/overview')
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('[data-qa=metadata-calculated-by]').text().trim()).toStrictEqual(expected)
          })
      },
    )
  })

  describe('release dates scenarios', () => {
    it('Should show the calculated release dates for a CRDS calculation in the correct order', () => {
      calculateReleaseDatesService.getDetailedCalculationResults.mockResolvedValue(stubbedDetailedCalculationResults)
      calculateReleaseDatesService.getCalculationHistoryPage.mockResolvedValue(stubbedFullPageOfCalculationHistory)
      prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      return request(app)
        .get('/view/A1234AA/calculation-history/CRDS/123456/overview')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const dateCards = $('[data-qa=release-dates-panel]').eq(0).find('.app-stat-card')
          expect(dateCards).toHaveLength(3)
          expect(dateCards.eq(0).text()).toContain('SED')
          expect(dateCards.eq(1).text()).toContain('CRD')
          expect(dateCards.eq(2).text()).toContain('HDCED')
        })
    })
  })

  describe('court cases and adjustments summary scenarios', () => {
    it('Should show the court cases and sentence counts', () => {
      calculateReleaseDatesService.getDetailedCalculationResults.mockResolvedValue(stubbedDetailedCalculationResults)
      calculateReleaseDatesService.getCalculationHistoryPage.mockResolvedValue(stubbedFullPageOfCalculationHistory)
      prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      return request(app)
        .get('/view/A1234AA/calculation-history/CRDS/123456/overview')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-qa=court-case-count]').eq(0).text().trim()).toStrictEqual('2')
          expect($('[data-qa=sentence-count]').eq(0).text().trim()).toStrictEqual('3')
        })
    })
    it('Should show none if no adjustments', () => {
      calculateReleaseDatesService.getDetailedCalculationResults.mockResolvedValue({
        ...stubbedDetailedCalculationResults,
        calculationOriginalData: {
          sentencesAndOffences: stubbedDetailedCalculationResults.calculationOriginalData.sentencesAndOffences,
          adjustments: [],
        },
      })
      calculateReleaseDatesService.getCalculationHistoryPage.mockResolvedValue(stubbedFullPageOfCalculationHistory)
      prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      return request(app)
        .get('/view/A1234AA/calculation-history/CRDS/123456/overview')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const adjustments = $('[data-qa=adjustment-types]').eq(0).find('p')
          expect(adjustments).toHaveLength(2) // contains the header
          expect(adjustments.eq(1).text()).toContain('None')
        })
    })
    it('Should show all adjustment types but only once', () => {
      calculateReleaseDatesService.getDetailedCalculationResults.mockResolvedValue({
        ...stubbedDetailedCalculationResults,
        calculationOriginalData: {
          sentencesAndOffences: stubbedDetailedCalculationResults.calculationOriginalData.sentencesAndOffences,
          adjustments: [
            { ...anAdjustment, adjustmentType: 'REMAND', days: 10 },
            { ...anAdjustment, adjustmentType: 'REMAND', days: 20 },
            { ...anAdjustment, adjustmentType: 'ADDITIONAL_DAYS_AWARDED', days: 20 },
          ],
        },
      })
      calculateReleaseDatesService.getCalculationHistoryPage.mockResolvedValue(stubbedFullPageOfCalculationHistory)
      prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      return request(app)
        .get('/view/A1234AA/calculation-history/CRDS/123456/overview')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const adjustments = $('[data-qa=adjustment-types]').eq(0).find('p')
          expect(adjustments).toHaveLength(3) // contains the header
          expect(adjustments.eq(1).text()).toContain('Remand')
          expect(adjustments.eq(2).text()).toContain('ADA (Additional days awarded)')
        })
    })
  })
})

const stubbedPrisonerData: PrisonApiPrisoner = {
  bookingId: 1,
  offenderId: 1,
  rootOffenderId: 1,
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
  assignedLivingUnit: {
    agencyName: 'Foo Prison (HMP)',
    description: 'D-2-003',
  } as PrisonAPIAssignedLivingUnit,
}

const stubbedDetailedCalculationResults: DetailedCalculationResults = {
  context: {
    calculationRequestId: 123456,
    overridesCalculationRequestId: 12345,
    prisonerId: 'A1234AA',
    bookingId: 123,
    calculationDate: '2020-06-01',
    calculationStatus: 'CONFIRMED',
    calculationReference: 'ABC123',
    calculationType: 'CALCULATED',
    calculationReason: {
      id: 1,
      displayName: 'A calculation reason',
      isOther: false,
      useForApprovedDates: false,
      requiresFurtherDetail: false,
      isSecondCheck: false,
    },
    otherReasonDescription: null,
    usePreviouslyRecordedSLEDIfFound: false,
    calculatedByUsername: 'user1',
    calculatedByDisplayName: 'User One',
    calculatedAtPrisonDescription: 'HMP Brixham',
  },
  dates: {
    CRD: {
      date: '2021-02-03',
      type: 'CRD',
      description: 'Conditional release date',
      hints: [{ text: 'Tuesday, 02 February 2021 when adjusted to a working day' }],
    },
    SED: { date: '2021-02-03', type: 'SED', description: 'Sentence expiry date', hints: [] },
    HDCED: {
      date: '2021-10-03',
      type: 'HDCED',
      description: 'Home detention curfew eligibility date',
      hints: [{ text: 'Tuesday, 05 October 2021 when adjusted to a working day' }],
    },
  },
  calculationBreakdown: null,
  calculationOriginalData: {
    prisonerDetails: {
      firstName: stubbedPrisonerData.firstName,
      lastName: stubbedPrisonerData.lastName,
      bookingId: stubbedPrisonerData.bookingId,
      agencyId: stubbedPrisonerData.agencyId,
      offenderNo: stubbedPrisonerData.offenderNo,
      dateOfBirth: stubbedPrisonerData.dateOfBirth,
      assignedLivingUnit: {
        agencyId: stubbedPrisonerData?.assignedLivingUnit?.agencyId,
        agencyName: stubbedPrisonerData?.assignedLivingUnit?.agencyName,
        description: stubbedPrisonerData?.assignedLivingUnit?.description,
        locationId: stubbedPrisonerData?.assignedLivingUnit?.locationId,
      },
      alerts: [],
    },
    sentencesAndOffences: [
      {
        bookingId: 1,
        sentenceStatus: '',
        sentenceCategory: '',
        sentenceDate: '2021-02-03',
        terms: [
          {
            years: 3,
            months: 0,
            weeks: 0,
            days: 0,
            code: 'IMP',
          },
        ],
        sentenceCalculationType: 'ADIMP',
        sentenceTypeDescription: 'SDS Standard Sentence',
        caseSequence: 1,
        lineSequence: 1,
        sentenceSequence: 1,
        offence: {
          offenderChargeId: 1,
          offenceEndDate: '2021-02-03',
          offenceCode: '123',
          offenceDescription: '',
          indicators: [],
        },
        revocationDates: [],
        sentenceAndOffenceAnalysis: 'SAME',
        isSDSPlus: false,
        hasAnSDSEarlyReleaseExclusion: 'NO',
      },
      {
        bookingId: 1,
        sentenceStatus: '',
        sentenceCategory: '',
        sentenceDate: '2021-02-03',
        terms: [
          {
            years: 2,
            months: 0,
            weeks: 0,
            days: 0,
            code: 'IMP',
          },
        ],
        caseSequence: 2,
        lineSequence: 2,
        sentenceSequence: 2,
        consecutiveToSequence: 1,
        sentenceCalculationType: 'ADIMP',
        sentenceTypeDescription: 'SDS Standard Sentence',
        offence: {
          offenderChargeId: 5,
          offenceEndDate: '2021-02-03',
          offenceCode: '123',
          offenceDescription: '',
          indicators: [],
        },
        revocationDates: [],
        sentenceAndOffenceAnalysis: 'SAME',
        isSDSPlus: false,
        hasAnSDSEarlyReleaseExclusion: 'NO',
      },
      {
        bookingId: 1,
        sentenceStatus: '',
        sentenceCategory: '',
        sentenceDate: '2021-02-03',
        terms: [
          {
            years: 2,
            months: 0,
            weeks: 0,
            days: 0,
            code: 'IMP',
          },
        ],
        caseSequence: 2,
        lineSequence: 3,
        sentenceSequence: 3,
        consecutiveToSequence: 2,
        sentenceCalculationType: 'ADIMP',
        sentenceTypeDescription: 'SDS Standard Sentence',
        offence: {
          offenderChargeId: 9,
          offenceEndDate: '2021-02-03',
          offenceCode: '123',
          offenceDescription: '',
          indicators: [],
        },
        revocationDates: [],
        sentenceAndOffenceAnalysis: 'SAME',
        isSDSPlus: false,
        hasAnSDSEarlyReleaseExclusion: 'NO',
      },
    ],
  },
  approvedDates: {},
  allocatedTranches: [],
}

const stubbedFullPageOfCalculationHistory: HistoricCalculationSummaryPage = {
  items: [
    {
      calculationDate: '2025-06-30',
      calculationSource: 'CRDS',
      calculationType: 'CALCULATED',
      crdsCalculationId: stubbedDetailedCalculationResults.context.calculationRequestId,
      reasonDescription: 'First one',
      calculatedByDisplayName: 'Fred',
      establishmentCalculatedAtDescription: 'Kirkham',
    },
    {
      calculationDate: '2025-06-29',
      calculationSource: 'NOMIS',
      calculationType: 'CALCULATED',
      crdsCalculationId: 29,
      nomisCalculationId: 9999929,
      reasonDescription: 'Second one',
      calculatedByDisplayName: 'Fred',
      establishmentCalculatedAtDescription: 'Kirkham',
    },
    {
      calculationDate: '2025-06-28',
      calculationSource: 'CRDS',
      calculationType: 'CALCULATED',
      crdsCalculationId: 28,
      reasonDescription: 'Third one',
      calculatedByDisplayName: 'Fred',
      establishmentCalculatedAtDescription: 'Kirkham',
    },
    {
      calculationDate: '2025-06-27',
      calculationSource: 'CRDS',
      calculationType: 'CALCULATED',
      crdsCalculationId: 27,
      reasonDescription: 'Fourth one',
      calculatedByDisplayName: 'Fred',
      establishmentCalculatedAtDescription: 'Kirkham',
    },
    {
      calculationDate: '2025-06-26',
      calculationSource: 'CRDS',
      calculationType: 'CALCULATED',
      crdsCalculationId: 26,
      reasonDescription: 'Fifth one',
      calculatedByDisplayName: 'Fred',
      establishmentCalculatedAtDescription: 'Kirkham',
    },
    {
      calculationDate: '2025-06-25',
      calculationSource: 'CRDS',
      calculationType: 'CALCULATED',
      crdsCalculationId: 25,
      reasonDescription: 'Sixth one',
      calculatedByDisplayName: 'Fred',
      establishmentCalculatedAtDescription: 'Kirkham',
    },
    {
      calculationDate: '2025-06-24',
      calculationSource: 'CRDS',
      calculationType: 'CALCULATED',
      crdsCalculationId: 24,
      reasonDescription: 'Seventh one',
      calculatedByDisplayName: 'Fred',
      establishmentCalculatedAtDescription: 'Kirkham',
    },
    {
      calculationDate: '2025-06-23',
      calculationSource: 'CRDS',
      calculationType: 'CALCULATED',
      crdsCalculationId: 23,
      reasonDescription: 'Eighth one',
      calculatedByDisplayName: 'Fred',
      establishmentCalculatedAtDescription: 'Kirkham',
    },
    {
      calculationDate: '2025-06-22',
      calculationSource: 'CRDS',
      calculationType: 'CALCULATED',
      crdsCalculationId: 22,
      reasonDescription: 'Ninth one',
      calculatedByDisplayName: 'Fred',
      establishmentCalculatedAtDescription: 'Kirkham',
    },
    {
      calculationDate: '2025-06-21',
      calculationSource: 'CRDS',
      calculationType: 'CALCULATED',
      crdsCalculationId: 21,
      reasonDescription: 'Tenth one',
      calculatedByDisplayName: 'Fred',
      establishmentCalculatedAtDescription: 'Kirkham',
    },
  ],
  page: {
    pageNumber: 1,
    totalPages: 5,
    totalItems: 57,
  },
}
const anAdjustment = {
  bookingId: 123458,
  person: 'A3752DZ',
  id: 'id',
  days: 1,
  remand: null,
  additionalDaysAwarded: null,
  unlawfullyAtLarge: null,
  lawfullyAtLarge: null,
  specialRemission: null,
  taggedBail: null,
  timeSpentInCustodyAbroad: null,
  timeSpentAsAnAppealApplicant: null,
  sentenceSequence: 3,
  adjustmentArithmeticType: 'DEDUCTION',
  prisonName: 'Kirkham (HMP)',
  prisonId: 'KMI',
  lastUpdatedBy: 'CRD_TEST_USER',
  status: 'ACTIVE',
  lastUpdatedDate: '2024-03-27T12:24:50.36377',
  createdDate: '2024-03-27T12:24:50.36377',
  effectiveDays: 1,
  source: 'DPS',
} as AdjustmentDto

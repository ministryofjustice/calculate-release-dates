import type { Express } from 'express'
import * as cheerio from 'cheerio'
import request from 'supertest'
import {
  ReleaseDatesAndCalculationContext,
  SentenceAndOffenceWithReleaseArrangements,
} from '../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import PrisonerService from '../../services/prisonerService'
import UserService from '../../services/userService'
import ViewReleaseDatesService from '../../services/viewReleaseDatesService'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import { appWithAllRoutes } from '../testutils/appSetup'
import {
  AnalysedPrisonApiBookingAndSentenceAdjustments,
  PrisonAPIAssignedLivingUnit,
  PrisonApiPrisoner,
  PrisonApiSentenceDetail,
} from '../../@types/prisonApi/prisonClientTypes'

jest.mock('../../services/prisonerService')
jest.mock('../../services/viewReleaseDatesService')
jest.mock('../../services/calculateReleaseDatesService')

const prisonerService = new PrisonerService(null, null) as jest.Mocked<PrisonerService>
new UserService(null, prisonerService) as jest.Mocked<UserService>
const viewReleaseDatesService = new ViewReleaseDatesService(null) as jest.Mocked<ViewReleaseDatesService>
const calculateReleaseDatesService = new CalculateReleaseDatesService(
  null,
  null,
) as jest.Mocked<CalculateReleaseDatesService>

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
const stubbedAdjustments = {
  sentenceAdjustments: [
    {
      sentenceSequence: 1,
      type: 'REMAND',
      numberOfDays: 2,
      fromDate: '2021-02-01',
      toDate: '2021-02-02',
      active: true,
    },
  ],
  bookingAdjustments: [
    {
      type: 'UNLAWFULLY_AT_LARGE',
      numberOfDays: 2,
      fromDate: '2021-03-07',
      toDate: '2021-03-08',
      active: true,
    },
  ],
} as AnalysedPrisonApiBookingAndSentenceAdjustments

const stubbedSentencesAndOffences = [
  {
    terms: [
      {
        years: 3,
      },
    ],
    sentenceDate: '2004-02-03',
    sentenceCalculationType: 'ADIMP',
    sentenceTypeDescription: 'SDS Standard Sentence',
    caseSequence: 1,
    lineSequence: 1,
    sentenceSequence: 1,
    offence: { offenceEndDate: '2021-02-03' },
    isSDSPlus: false,
  } as SentenceAndOffenceWithReleaseArrangements,
  {
    terms: [
      {
        years: 3,
      },
    ],
    sentenceCalculationType: 'ADIMP',
    sentenceTypeDescription: 'SDS Standard Sentence',
    caseSequence: 1,
    lineSequence: 1,
    sentenceSequence: 1,
    offence: { offenceStartDate: '2021-01-04', offenceEndDate: '2021-01-05' },
    isSDSPlus: false,
  } as SentenceAndOffenceWithReleaseArrangements,
  {
    terms: [
      {
        years: 3,
      },
    ],
    sentenceCalculationType: 'ADIMP',
    sentenceTypeDescription: 'SDS Standard Sentence',
    caseSequence: 1,
    lineSequence: 1,
    sentenceSequence: 1,
    offence: { offenceStartDate: '2021-03-06' },
    isSDSPlus: false,
  } as SentenceAndOffenceWithReleaseArrangements,
  {
    terms: [
      {
        years: 3,
      },
    ],
    sentenceCalculationType: 'ADIMP',
    sentenceTypeDescription: 'SDS Standard Sentence',
    caseSequence: 1,
    lineSequence: 1,
    sentenceSequence: 1,
    offence: {},
    isSDSPlus: false,
  } as SentenceAndOffenceWithReleaseArrangements,
  {
    terms: [
      {
        years: 3,
      },
    ],
    sentenceCalculationType: 'ADIMP',
    sentenceTypeDescription: 'SDS Standard Sentence',
    caseSequence: 1,
    lineSequence: 1,
    sentenceSequence: 1,
    offence: { offenceStartDate: '2021-01-07', offenceEndDate: '2021-01-07' },
    isSDSPlus: false,
  } as SentenceAndOffenceWithReleaseArrangements,
  {
    terms: [
      {
        years: 2,
      },
    ],
    caseSequence: 2,
    lineSequence: 2,
    sentenceSequence: 2,
    consecutiveToSequence: 1,
    sentenceCalculationType: 'ADIMP',
    sentenceTypeDescription: 'SDS Standard Sentence',
    offence: { offenceEndDate: '2021-02-03', offenceCode: '123', offenceDescription: 'Doing a crime' },
    isSDSPlus: false,
  } as SentenceAndOffenceWithReleaseArrangements,
]
const stubbedReleaseDatesUsingCalcReqId: ReleaseDatesAndCalculationContext = {
  calculation: {
    calculationRequestId: 51245,
    bookingId: 1201571,
    prisonerId: 'A8031DY',
    calculationStatus: 'CONFIRMED',
    calculationReference: 'fe1909af-c780-4b61-9ca3-a82678de5dca',
    calculationReason: {
      id: 8,
      isOther: false,
      displayName: 'A calculation reason',
      useForApprovedDates: false,
      requiresFurtherDetail: false,
    },
    otherReasonDescription: '',
    calculationDate: '2020-06-01',
    calculationType: 'CALCULATED',
    usePreviouslyRecordedSLEDIfFound: false,
    calculatedByUsername: 'user1',
    calculatedByDisplayName: 'User One',
  },
  dates: [
    {
      type: 'SED',
      description: 'Sentence expiry date',
      date: '2021-02-03',
      hints: [],
    },
    {
      type: 'CRD',
      description: 'Conditional release date',
      date: '2021-02-03',
      hints: [],
    },
    {
      type: 'HDCED',
      description: 'Home detention curfew eligibility date',
      date: '2021-10-03',
      hints: [],
    },
  ],
}

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      prisonerService,
      viewReleaseDatesService,
      calculateReleaseDatesService,
    },
  })
})

describe('Print Notification slip controller tests', () => {
  it('GET /view/:nomsId/calculation-summary/:calculationRequestId/printNotificationSlip?fromPage=view should generate page', () => {
    const stubbedSentencesAndOffencesLocal = [
      {
        terms: [
          {
            years: 3,
            code: 'IMP',
          },
        ],
        sentenceDate: '2004-02-03',
        sentenceCalculationType: 'ADIMP',
        sentenceTypeDescription: 'SDS Standard Sentence',
        caseSequence: 1,
        lineSequence: 1,
        sentenceSequence: 1,
        offence: { offenceEndDate: '2021-02-03' },
        isSDSPlus: false,
      } as SentenceAndOffenceWithReleaseArrangements,
      {
        terms: [
          {
            years: 2,
          },
        ],
        sentenceDate: '2010-02-03',
        caseSequence: 2,
        lineSequence: 2,
        sentenceSequence: 2,
        consecutiveToSequence: 1,
        sentenceCalculationType: 'ADIMP',
        sentenceTypeDescription: 'SDS Standard Sentence',
        offence: { offenceEndDate: '2021-02-03', offenceCode: '123', offenceDescription: 'Doing a crime' },
        isSDSPlus: false,
      } as SentenceAndOffenceWithReleaseArrangements,
    ]
    viewReleaseDatesService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffencesLocal)
    viewReleaseDatesService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedAdjustments)
    calculateReleaseDatesService.getReleaseDatesForACalcReqId.mockResolvedValue(stubbedReleaseDatesUsingCalcReqId)
    viewReleaseDatesService.getAdjustmentsDtosForCalculation.mockResolvedValue([
      {
        person: 'A1234AA',
        sentenceSequence: 1,
        adjustmentType: 'REMAND',
        days: 28,
        fromDate: '2021-02-03',
        toDate: '2021-03-08',
        status: 'ACTIVE',
      },
    ])
    return request(app)
      .get('/view/A1234AA/calculation-summary/123456/printNotificationSlip?fromPage=view')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const backLink = $('[data-qa=back-link]').first()
        const offenderSlipBtn = $('[data-qa=slip-offender-copy]').first()
        const establishmentSlipBtn = $('[data-qa=slip-establishment-copy]').first()
        const pageTitle = $('[data-qa=page-title]').first()
        const prisonTitle = $('[data-qa=prison-name]').first()
        const prisonerName = $('[data-qa=prisoner-name]').first()
        const prisonerCell = $('[data-qa=prisoner-cell]').first()
        const offenderNumber = $('[data-qa=offender-number]').first()
        const calculationDate = $('[data-qa=calculation-date]').first()
        const releaseDatesTitle = $('[data-qa=release-date-title]').first()
        const crdTitle = $('[data-qa=CRD-title]').first()
        const crdDate = $('[data-qa=CRD-date]').first()
        const sedTitle = $('[data-qa=SED-title]').first()
        const sedDate = $('[data-qa=SED-date]').first()
        const hdcedTitle = $('[data-qa=HDCED-title]').first()
        const hdcedDate = $('[data-qa=HDCED-date]').first()
        const sentenceTitle = $('[data-qa=sentence-title]').first()
        const sentenceColTitle = $('[data-qa=sentence-col-title]').first()
        const sentenceColDate = $('[data-qa=sentence-col-date]').first()
        const sentenceColLength = $('[data-qa=sentence-col-length]').first()
        const sentence11Title = $('[data-qa=sentence-1-1-title]').first()
        const sentence11Date = $('[data-qa=sentence-1-1-date]').first()
        const sentence11Length = $('[data-qa=sentence-1-1-length]').first()
        const sentence22Title = $('[data-qa=sentence-2-2-title]').first()
        const sentence22Date = $('[data-qa=sentence-2-2-date]').first()
        const sentence22Length = $('[data-qa=sentence-2-2-length]').first()
        const adjustTitle = $('[data-qa=adjust-title]').first()
        const remandTable = $('[data-qa=remand-table]').first()
        const offenderSlipLink = $('[data-qa="slip-offender-copy"]').first()
        const establishmentSlipLink = $('[data-qa="slip-establishment-copy"]').first()
        const offenderHDCED = $('[data-qa="offender-hdced-text"]').first()
        const calcReasonTitle = $('[data-qa="calculation-reason-title"]')
        const calcReason = $('[data-qa="calculation-reason"]')

        expect(offenderSlipLink.attr('href')).toStrictEqual(
          '/view/A1234AA/calculation-summary/123456/printNotificationSlip?fromPage=view&pageType=offender',
        )
        expect(establishmentSlipLink.attr('href')).toStrictEqual(
          '/view/A1234AA/calculation-summary/123456/printNotificationSlip?fromPage=view&pageType=establishment',
        )
        expect(backLink.attr('href')).toStrictEqual('/?prisonId=A1234AA')
        expect(offenderSlipBtn.text()).toContain('Print notification slip')
        expect(establishmentSlipBtn.text()).toContain('Print establishment copy')
        expect(pageTitle.text()).toContain('Release dates notification slip')
        expect(prisonTitle.text()).toContain('Foo Prison (HMP)')
        expect(prisonerName.text()).toContain('Anon Nobody')
        expect(prisonerCell.text()).toContain('D-2-003')
        expect(offenderNumber.text()).toContain('A1234AA')
        expect(releaseDatesTitle.text()).toContain('Release dates')
        expect(calculationDate.text()).toStrictEqual('These release dates were calculated on 01 June 2020.')
        expect(crdTitle.text()).toContain('CRD (Conditional release date)')
        expect(crdDate.text()).toContain('03 February 2021')
        expect(sedTitle.text()).toContain('SED (Sentence expiry date)')
        expect(sedDate.text()).toContain('03 February 2021')
        expect(hdcedTitle.text()).toContain('HDCED (Home detention curfew eligibility date)')
        expect(hdcedDate.text()).toContain('03 October 2021')
        expect(sentenceTitle.text()).toContain('Sentence details')
        expect(sentenceColTitle.text()).toContain('Sentence')
        expect(sentenceColDate.text()).toContain('Sentence start date')
        expect(sentenceColLength.text()).toContain('Sentence length')
        expect(sentence11Title.text()).toContain('Court case 1, NOMIS line number 1')
        expect(sentence11Date.text()).toContain('03 February 2004')
        expect(sentence22Title.text()).toContain('Court case 2, NOMIS line number 2')
        expect(sentence22Date.text()).toContain('03 February 2010')
        expect(sentence11Length.text().trim()).toContain('3')
        expect(sentence11Length.text().trim()).toContain('years')
        expect(sentence22Length.text().trim()).toContain('2')
        expect(sentence22Length.text().trim()).toContain('years')
        expect(sentence22Length.text().trim()).toContain('consecutive to court case 1 NOMIS line number 1')
        expect(adjustTitle.text()).toContain('Adjustments')
        expect(remandTable).toHaveLength(1)
        expect(offenderHDCED.length).toStrictEqual(0)
        expect(calcReasonTitle.text()).toContain('Calculation reason')
        expect(calcReason.text()).toContain('A calculation reason')
      })
  })

  it('GET /view/:nomsId/calculation-summary/:calculationRequestId/printNotificationSlip?fromPage=view&pageType=offender should have correct content for pageType Offender', () => {
    viewReleaseDatesService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    viewReleaseDatesService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedAdjustments)
    calculateReleaseDatesService.getReleaseDatesForACalcReqId.mockResolvedValue(stubbedReleaseDatesUsingCalcReqId)
    return request(app)
      .get('/view/A1234AA/calculation-summary/123456/printNotificationSlip?fromPage=view&pageType=offender')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const pageTitleCaption = $('[data-qa="page-title-caption"]').first()
        const offenderDisagreeText = $('[data-qa="offender-disagree-text"]').first()
        const calculatedBy = $('[data-qa="calculated-by"]')
        const checkedBy = $('[data-qa="checked-by"]')
        const calcReasonTitle = $('[data-qa="calculation-reason-title"]')
        const calcReason = $('[data-qa="calculation-reason"]')
        const printInvoker = $('[data-qa="print-invoker"]').first()
        const offenderHDCED = $('[data-qa="offender-hdced-text"]').first()

        expect(printInvoker.attr('src')).toStrictEqual('/assets/js/print.js')
        expect(calculatedBy.length).toStrictEqual(0)
        expect(calcReasonTitle.text()).toContain('Calculation reason')
        expect(calcReason.text()).toContain('A calculation reason')
        expect(checkedBy.length).toStrictEqual(0)
        expect(pageTitleCaption.text()).toStrictEqual("[Anon Nobody's copy]")
        expect(offenderHDCED.text()).toStrictEqual(
          'Release on HDC (Home Detention Curfew) is subject to an assessment.',
        )
        expect(offenderDisagreeText.text()).toStrictEqual(
          'If you disagree with the above dates, please write down what you think the dates should be and hand to your wing office.',
        )
      })
  })

  it('GET /view/:nomsId/calculation-summary/:calculationRequestId/printNotificationSlip?fromPage=view&pageType=establishment should have correct content for pageType Establishment', () => {
    viewReleaseDatesService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    viewReleaseDatesService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedAdjustments)
    calculateReleaseDatesService.getReleaseDatesForACalcReqId.mockResolvedValue(stubbedReleaseDatesUsingCalcReqId)
    return request(app)
      .get('/view/A1234AA/calculation-summary/123456/printNotificationSlip?fromPage=view&pageType=establishment')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const pageTitleCaption = $('[data-qa="page-title-caption"]').first()
        const offenderDisagreeText = $('[data-qa="offender-disagree-text"]')
        const calculatedBy = $('[data-qa="calculated-by"]').first()
        const checkedBy = $('[data-qa="checked-by"]').first()
        const calcReasonTitle = $('[data-qa="calculation-reason-title"]').first()
        const calcReason = $('[data-qa="calculation-reason"]').first()
        const printInvoker = $('[data-qa="print-invoker"]').first()
        const offenderHDCED = $('[data-qa="offender-hdced-text"]').first()

        expect(printInvoker.attr('src')).toStrictEqual('/assets/js/print.js')
        expect(calculatedBy.text()).toStrictEqual('Calculated by:')
        expect(calcReasonTitle.text()).toContain('Calculation reason')
        expect(calcReason.text()).toContain('A calculation reason')
        expect(checkedBy.text()).toStrictEqual('Checked by:')
        expect(pageTitleCaption.text()).toStrictEqual('[Establishment copy]')
        expect(offenderDisagreeText.length).toStrictEqual(0)
        expect(offenderHDCED.length).toStrictEqual(0)
      })
  })

  it('GET /calculation/:nomsId/summary/:calculationRequestId/printNotificationSlip?fromPage=calculation should generate page', () => {
    viewReleaseDatesService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    viewReleaseDatesService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedAdjustments)
    calculateReleaseDatesService.getReleaseDatesForACalcReqId.mockResolvedValue(stubbedReleaseDatesUsingCalcReqId)
    return request(app)
      .get('/calculation/A1234AA/summary/123456/printNotificationSlip?fromPage=calculation')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const backLink = $('[data-qa=back-link]').first()
        const offenderSlipLink = $('[data-qa="slip-offender-copy"]').first()
        const establishmentSlipLink = $('[data-qa="slip-establishment-copy"]').first()

        expect(backLink.attr('href')).toStrictEqual('/calculation/A1234AA/complete/123456')
        expect(offenderSlipLink.attr('href')).toStrictEqual(
          '/calculation/A1234AA/summary/123456/printNotificationSlip?fromPage=calculation&pageType=offender',
        )
        expect(establishmentSlipLink.attr('href')).toStrictEqual(
          '/calculation/A1234AA/summary/123456/printNotificationSlip?fromPage=calculation&pageType=establishment',
        )
      })
  })

  it('GET /calculation/:nomsId/summary/:calculationRequestId/printNotificationSlip?fromPage=view&pageType=offender should generate page without HDCED text', () => {
    const stubbedReleaseDatesWithoutHDCED: ReleaseDatesAndCalculationContext = {
      calculation: {
        calculationRequestId: 51245,
        bookingId: 1201571,
        prisonerId: 'A8031DY',
        calculationStatus: 'CONFIRMED',
        calculationReference: 'fe1909af-c780-4b61-9ca3-a82678de5dca',
        calculationReason: {
          id: 8,
          isOther: false,
          displayName: 'A calculation reason',
          useForApprovedDates: false,
          requiresFurtherDetail: false,
        },
        otherReasonDescription: '',
        calculationDate: '2020-06-01',
        calculationType: 'CALCULATED',
        usePreviouslyRecordedSLEDIfFound: false,
        calculatedByUsername: 'user1',
        calculatedByDisplayName: 'User One',
      },
      dates: [
        {
          type: 'SED',
          description: 'Sentence expiry date',
          date: '2021-02-03',
          hints: [],
        },
        {
          type: 'CRD',
          description: 'Conditional release date',
          date: '2021-02-03',
          hints: [],
        },
      ],
    }
    viewReleaseDatesService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    viewReleaseDatesService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedAdjustments)
    calculateReleaseDatesService.getReleaseDatesForACalcReqId.mockResolvedValue(stubbedReleaseDatesWithoutHDCED)
    return request(app)
      .get('/calculation/A1234AA/summary/123456/printNotificationSlip?fromPage=view&pageType=offender')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const offenderHDCED = $('[data-qa="offender-hdced-text"]').first()

        expect(offenderHDCED.length).toStrictEqual(0)
      })
  })

  it('GET /calculation/:nomsId/summary/:calculationRequestId/printNotificationSlip?fromPage=calculation should terms - singular', () => {
    const stubbedSentencesAndOffencesLocal = [
      {
        terms: [
          {
            years: 1,
            months: 1,
            weeks: 1,
            days: 1,
            code: 'IMP',
          },
        ],
        sentenceDate: '2004-02-03',
        sentenceCalculationType: 'ADIMP',
        sentenceTypeDescription: 'SDS Standard Sentence',
        caseSequence: 1,
        lineSequence: 1,
        sentenceSequence: 1,
        offence: { offenceEndDate: '2021-02-03' },
        isSDSPlus: false,
      } as SentenceAndOffenceWithReleaseArrangements,
    ]
    viewReleaseDatesService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffencesLocal)
    viewReleaseDatesService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedAdjustments)
    calculateReleaseDatesService.getReleaseDatesForACalcReqId.mockResolvedValue(stubbedReleaseDatesUsingCalcReqId)
    return request(app)
      .get('/calculation/A1234AA/summary/123456/printNotificationSlip?fromPage=calculation')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        let sentence11Length = $('[data-qa=sentence-1-1-length]').first().text()
        sentence11Length = sentence11Length.replace(/\s/g, '')

        expect(sentence11Length).toStrictEqual('1year1month1week1day')
      })
  })

  it('GET /calculation/:nomsId/summary/:calculationRequestId/printNotificationSlip?fromPage=calculation should terms - plural', () => {
    const stubbedSentencesAndOffencesLocal = [
      {
        terms: [
          {
            years: 2,
            months: 2,
            weeks: 2,
            days: 2,
            code: 'IMP',
          },
        ],
        sentenceDate: '2004-02-03',
        sentenceCalculationType: 'ADIMP',
        sentenceTypeDescription: 'SDS Standard Sentence',
        caseSequence: 1,
        lineSequence: 1,
        sentenceSequence: 1,
        offence: { offenceEndDate: '2021-02-03' },
        isSDSPlus: false,
      } as SentenceAndOffenceWithReleaseArrangements,
    ]
    viewReleaseDatesService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffencesLocal)
    viewReleaseDatesService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedAdjustments)
    calculateReleaseDatesService.getReleaseDatesForACalcReqId.mockResolvedValue(stubbedReleaseDatesUsingCalcReqId)
    return request(app)
      .get('/calculation/A1234AA/summary/123456/printNotificationSlip?fromPage=calculation')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        let sentence11Length = $('[data-qa=sentence-1-1-length]').first().text()
        sentence11Length = sentence11Length.replace(/\s/g, '')

        expect(sentence11Length).toStrictEqual('2years2months2weeks2days')
      })
  })

  it('GET /calculation/:nomsId/summary/:calculationRequestId/printNotificationSlip?fromPage=calculation&pageType=offender should generate correct content for Offender Name, Agency Name, keyDates and Adjustments', () => {
    const stubbedNoReleaseDates: ReleaseDatesAndCalculationContext = {
      calculation: {
        calculationRequestId: 51245,
        bookingId: 1201571,
        prisonerId: 'A8031DY',
        calculationStatus: 'CONFIRMED',
        calculationReference: 'fe1909af-c780-4b61-9ca3-a82678de5dca',
        calculationReason: {
          id: 8,
          isOther: false,
          displayName: 'A calculation reason',
          useForApprovedDates: false,
          requiresFurtherDetail: false,
        },
        otherReasonDescription: '',
        calculationDate: '2020-06-01',
        calculationType: 'CALCULATED',
        usePreviouslyRecordedSLEDIfFound: false,
        calculatedByUsername: 'user1',
        calculatedByDisplayName: 'User One',
      },
      dates: [],
    }
    const stubbedNoAdjustments = {
      sentenceAdjustments: [],
      bookingAdjustments: [],
    } as AnalysedPrisonApiBookingAndSentenceAdjustments
    const stubbedNoPrisonPrisonerData = {
      offenderNo: 'A1234AA',
      firstName: 'Anon',
      lastName: 'Bloggs',
      sentenceDetail: {} as PrisonApiSentenceDetail,
      assignedLivingUnit: {} as PrisonAPIAssignedLivingUnit,
    } as PrisonApiPrisoner
    viewReleaseDatesService.getPrisonerDetail.mockResolvedValue(stubbedNoPrisonPrisonerData)
    viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    viewReleaseDatesService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedNoAdjustments)
    calculateReleaseDatesService.getReleaseDatesForACalcReqId.mockResolvedValue(stubbedNoReleaseDates)
    viewReleaseDatesService.getAdjustmentsDtosForCalculation.mockResolvedValue([])

    return request(app)
      .get('/calculation/A1234AA/summary/123456/printNotificationSlip?fromPage=calculation&pageType=offender')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const noAdjustments = $('[data-qa=no-active-adjustments-hint]').first()
        const prisonTitle = $('[data-qa=prison-name]').first()
        const prisonerCell = $('[data-qa=prisoner-cell]').first()
        const dtoTitle = $('[data-qa=dto-title]').first()
        const dtoText = $('[data-qa=dto-text]').first()
        const pageTitleCaption = $('[data-qa="page-title-caption"]').first()

        expect(pageTitleCaption.text()).toStrictEqual("[Anon Bloggs' copy]")
        expect(noAdjustments.text()).toStrictEqual('There are no active adjustments.')
        expect(prisonTitle.text()).toContain('No agency name available')
        expect(prisonerCell.text()).toContain('No Cell Number available')
        expect(dtoTitle.length).toStrictEqual(0)
        expect(dtoText.length).toStrictEqual(0)
      })
  })

  it('GET /calculation/:nomsId/summary/:calculationRequestId/printNotificationSlip?fromPage=calculation should generate correct content for a DTO only sentence', () => {
    const stubbedSentencesAndOffencesLocal = [
      {
        terms: [
          {
            years: 2,
            months: 2,
            weeks: 2,
            days: 2,
            code: 'IMP',
          },
        ],
        sentenceDate: '2004-02-03',
        sentenceCalculationType: 'DTO',
        sentenceTypeDescription: 'Detention and Training Order',
        caseSequence: 1,
        lineSequence: 1,
        sentenceSequence: 1,
        offence: { offenceEndDate: '2021-02-03' },
        isSDSPlus: false,
      } as SentenceAndOffenceWithReleaseArrangements,
      {
        terms: [
          {
            years: 2,
            months: 2,
            weeks: 2,
            days: 2,
            code: 'IMP',
          },
        ],
        sentenceDate: '2004-02-03',
        sentenceCalculationType: 'DTO_ORA',
        sentenceTypeDescription: 'Detention and Training Order',
        caseSequence: 1,
        lineSequence: 1,
        sentenceSequence: 1,
        offence: { offenceEndDate: '2021-02-03' },
        isSDSPlus: false,
      } as SentenceAndOffenceWithReleaseArrangements,
    ]
    const stubbedNoAdjustments = {
      sentenceAdjustments: [],
      bookingAdjustments: [],
    } as AnalysedPrisonApiBookingAndSentenceAdjustments
    const stubbedNoPrisonPrisonerData = {
      sentenceDetail: {} as PrisonApiSentenceDetail,
      assignedLivingUnit: {} as PrisonAPIAssignedLivingUnit,
    } as PrisonApiPrisoner
    const stubbedReleaseDatesUsingCalcReqIdLocal: ReleaseDatesAndCalculationContext = {
      calculation: {
        calculationRequestId: 51245,
        bookingId: 1201571,
        prisonerId: 'A8031DY',
        calculationStatus: 'CONFIRMED',
        calculationReference: 'fe1909af-c780-4b61-9ca3-a82678de5dca',
        calculationReason: {
          id: 8,
          isOther: false,
          displayName: 'A calculation reason',
          useForApprovedDates: false,
          requiresFurtherDetail: false,
        },
        otherReasonDescription: '',
        calculationDate: '2020-06-01',
        calculationType: 'CALCULATED',
        usePreviouslyRecordedSLEDIfFound: false,
        calculatedByUsername: 'user1',
        calculatedByDisplayName: 'User One',
      },
      dates: [
        {
          type: 'LTD',
          description: 'Late transfer date',
          date: '2022-02-03',
          hints: [],
        },
        {
          type: 'ETD',
          description: 'Early transfer date',
          date: '2021-02-03',
          hints: [],
        },
        {
          type: 'MTD',
          description: 'Mid transfer date',
          date: '2021-10-03',
          hints: [],
        },
      ],
    }
    viewReleaseDatesService.getPrisonerDetail.mockResolvedValue(stubbedNoPrisonPrisonerData)
    viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffencesLocal)
    viewReleaseDatesService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedNoAdjustments)
    calculateReleaseDatesService.getReleaseDatesForACalcReqId.mockResolvedValue(stubbedReleaseDatesUsingCalcReqIdLocal)
    return request(app)
      .get('/calculation/A1234AA/summary/123456/printNotificationSlip?fromPage=calculation')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const dtoTitle = $('[data-qa=dto-title]').first()
        const dtoText = $('[data-qa=dto-text]').first()
        const releaseDatesTitle = $('[data-qa=release-date-title]').first()
        const ltdTitle = $('[data-qa=LTD-title]').first()
        const ltdDate = $('[data-qa=LTD-date]').first()
        const etdTitle = $('[data-qa=ETD-title]').first()
        const etdDate = $('[data-qa=ETD-date]').first()
        const mtdTitle = $('[data-qa=MTD-title]').first()
        const mtdDate = $('[data-qa=MTD-date]').first()

        expect(ltdTitle.text()).toContain('LTD (Late transfer date)')
        expect(ltdDate.text()).toContain('03 February 2022')
        expect(etdTitle.text()).toContain('ETD (Early transfer date)')
        expect(etdDate.text()).toContain('03 February 2021')
        expect(mtdTitle.text()).toContain('MTD (Mid transfer date)')
        expect(mtdDate.text()).toContain('03 October 2021')
        expect(releaseDatesTitle.text()).toStrictEqual('Release dates')
        expect(dtoTitle.text()).toStrictEqual('DTO (Detention training order) dates')
        expect(dtoText.text()).toStrictEqual(
          'Your DTO sentence dates with all adjustments including any days spent unlawfully at large (UAL) and/or time served pending appeal (TSPA) are as follows:',
        )
      })
  })

  it('GET /view/:nomsId/calculation-summary/:calculationRequestId/printNotificationSlip?fromPage=view should handle no calculation reason', () => {
    const stubbedSentencesAndOffencesLocal = [
      {
        terms: [
          {
            years: 3,
            code: 'IMP',
          },
        ],
        sentenceDate: '2004-02-03',
        sentenceCalculationType: 'ADIMP',
        sentenceTypeDescription: 'SDS Standard Sentence',
        caseSequence: 1,
        lineSequence: 1,
        sentenceSequence: 1,
        offence: { offenceEndDate: '2021-02-03' },
        isSDSPlus: false,
      } as SentenceAndOffenceWithReleaseArrangements,
      {
        terms: [
          {
            years: 2,
          },
        ],
        sentenceDate: '2010-02-03',
        caseSequence: 2,
        lineSequence: 2,
        sentenceSequence: 2,
        consecutiveToSequence: 1,
        sentenceCalculationType: 'ADIMP',
        sentenceTypeDescription: 'SDS Standard Sentence',
        offence: { offenceEndDate: '2021-02-03', offenceCode: '123', offenceDescription: 'Doing a crime' },
        isSDSPlus: false,
      } as SentenceAndOffenceWithReleaseArrangements,
    ]
    viewReleaseDatesService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    viewReleaseDatesService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffencesLocal)
    viewReleaseDatesService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedAdjustments)
    calculateReleaseDatesService.getReleaseDatesForACalcReqId.mockResolvedValue(
      Object.assign(stubbedReleaseDatesUsingCalcReqId, {
        calculation: {
          calculationReason: null,
        },
      }),
    )
    return request(app)
      .get('/view/A1234AA/calculation-summary/123456/printNotificationSlip?fromPage=view')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const calcReason = $('[data-qa="calculation-reason"]')
        expect(calcReason.text().trim()).toStrictEqual('Not specified')
      })
  })
})

import CalculateReleaseDatesService from './calculateReleaseDatesService'
import PrisonerService from './prisonerService'
import OneThousandCalculationsService from './oneThousandCalculationsService'
import {
  PrisonApiBookingAndSentenceAdjustments,
  PrisonApiOffenderCalculatedKeyDates,
  PrisonApiOffenderFinePayment,
  PrisonApiOffenderSentenceAndOffences,
  PrisonApiPrisoner,
  PrisonApiSentenceDetail,
} from '../@types/prisonApi/prisonClientTypes'
import {
  BookingCalculation,
  CalculationSentenceQuestion,
  CalculationUserQuestions,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import OneThousandCalculationsRow from '../models/OneThousandCalculationsRow'
import { pedAdjustedByCrdAndBeforePrrdBreakdown } from './breakdownExamplesTestData'

jest.mock('../services/calculateReleaseDatesService')
jest.mock('../services/prisonerService')

const prisoner = {
  offenderNo: 'A8541DY',
  bookingId: 1202076,
  dateOfBirth: '1978-04-30',
  activeAlertCount: 1,
  inactiveAlertCount: 0,
  alerts: [
    {
      alertId: 1,
      alertType: 'S',
      alertTypeDescription: 'Sexual Offence',
      alertCode: 'SOR',
      alertCodeDescription: 'Registered sex offender',
      dateCreated: '2022-01-10',
      dateExpires: '2030-01-10',
      expired: false,
      active: true,
      addedByFirstName: 'CRD',
      addedByLastName: 'TEST USER',
    },
  ],
  locationDescription: 'Kirkham (HMP)',
  firstName: 'Anon',
  lastName: 'Nobody',
  latestLocationId: 'LEI',
  age: 21,
  activeFlag: true,
  legalStatus: 'REMAND',
  category: 'Cat C',
  imprisonmentStatus: 'LIFE',
  imprisonmentStatusDescription: 'Serving Life Imprisonment',
  religion: 'Christian',
  agencyId: 'MDI',
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
} as PrisonApiPrisoner

const nomisDates = {
  sentenceExpiryDate: '2022-01-01',
  automaticReleaseDate: '2022-01-02',
  conditionalReleaseDate: '2022-01-03',
  nonParoleDate: '2022-01-04',
  postRecallReleaseDate: '2022-01-05',
  licenceExpiryDate: '2022-01-06',
  homeDetentionCurfewEligibilityDate: '2022-01-07',
  paroleEligibilityDate: '2022-01-08',
  homeDetentionCurfewActualDate: '2022-01-09',
  homeDetentionCurfewEligibilityCalculatedDate: '2022-02-07',
  homeDetentionCurfewEligibilityOverrideDate: '2022-02-08',
  actualParoleDate: '2022-01-10',
  releaseOnTemporaryLicenceDate: '2022-01-11',
  earlyRemovalSchemeEligibilityDate: '2022-11-11',
  earlyTermDate: '2022-01-13',
  midTermDate: '2022-01-14',
  lateTermDate: '2022-01-15',
  topupSupervisionExpiryDate: '2022-01-16',
  topupSupervisionExpiryCalculatedDate: '2022-02-09',
  topupSupervisionExpiryOverrideDate: '2022-02-10',
  tariffDate: '2022-01-17',
  dtoPostRecallReleaseDate: '2022-01-18',
  tariffEarlyRemovalSchemeEligibilityDate: '2022-01-19',
  effectiveSentenceEndDate: '2022-01-20',
  bookingId: 1,
  sentenceStartDate: '2022-01-21',
  additionalDaysAwarded: 1,
  automaticReleaseOverrideDate: '2022-01-22',
  conditionalReleaseOverrideDate: '2022-01-23',
  nonParoleOverrideDate: '2022-01-24',
  postRecallReleaseOverrideDate: '2022-01-25',
  dtoPostRecallReleaseDateOverride: '2022-01-26',
  nonDtoReleaseDate: '2022-01-27',
  sentenceExpiryCalculatedDate: '2022-01-28',
  sentenceExpiryOverrideDate: '2022-01-29',
  licenceExpiryCalculatedDate: '2022-01-30',
  licenceExpiryOverrideDate: '2022-01-31',
  paroleEligibilityCalculatedDate: '2022-02-01',
  paroleEligibilityOverrideDate: '2022-02-02',
  nonDtoReleaseDateType: 'CRD',
  confirmedReleaseDate: '2022-02-03',
  releaseDate: '2022-02-04',
  topupSupervisionStartDate: '2022-02-05',
  homeDetentionCurfewEndDate: '2022-02-06',
} as PrisonApiSentenceDetail

const keyDates = {
  conditionalReleaseDate: '2023-04-15',
  licenceExpiryDate: '2024-06-26',
  sentenceExpiryDate: '2024-06-26',
  effectiveSentenceEndDate: '2024-06-27',
  sentenceLength: '04/05/26',
  judiciallyImposedSentenceLength: '04/05/25',
  earlyRemovalSchemeEligibilityDate: '2022-11-11',
  releaseOnTemporaryLicenceDate: '2022-11-12',
  comment: 'This is a NOMIS calculation',
  reasonCode: 'NEW',
} as PrisonApiOffenderCalculatedKeyDates

const sentenceAndOffences = [
  {
    bookingId: 1202003,
    sentenceSequence: 1,
    lineSequence: 1,
    caseSequence: 1,
    courtDescription: 'Abergavenny Magistrates Court',
    sentenceStatus: 'A',
    sentenceCategory: '2003',
    sentenceCalculationType: 'ADIMP',
    sentenceTypeDescription: 'CJA03 Standard Determinate Sentence',
    sentenceDate: '2022-03-10',
    terms: [{ years: 0, months: 3, weeks: 0, days: 0, code: 'IMP' }],
    offences: [
      {
        offenderChargeId: 3932803,
        offenceStartDate: '2012-02-10',
        offenceCode: 'TH68010A',
        offenceDescription: 'Attempt theft from shop',
        indicators: ['D', '50'],
      },
    ],
  },
  {
    bookingId: 1202003,
    sentenceSequence: 2,
    consecutiveToSequence: 1,
    lineSequence: 2,
    caseSequence: 1,
    courtDescription: 'Abergavenny Magistrates Court',
    sentenceStatus: 'A',
    sentenceCategory: '2003',
    sentenceCalculationType: 'ADIMP',
    sentenceTypeDescription: 'CJA03 Standard Determinate Sentence',
    sentenceDate: '2022-03-10',
    terms: [{ years: 0, months: 3, weeks: 0, days: 0, code: 'IMP' }],
    offences: [
      {
        offenderChargeId: 3932805,
        offenceStartDate: '2012-02-10',
        offenceCode: 'AW06049',
        offenceDescription: 'Administer a poisonous / injurious drug / substance to a protected animal',
        indicators: ['113', '99'],
      },
    ],
  },
  {
    bookingId: 1202003,
    sentenceSequence: 3,
    consecutiveToSequence: 2,
    lineSequence: 3,
    caseSequence: 1,
    courtDescription: 'Abergavenny Magistrates Court',
    sentenceStatus: 'A',
    sentenceCategory: '2003',
    sentenceCalculationType: 'ADIMP_ORA',
    sentenceTypeDescription: 'ORA CJA03 Standard Determinate Sentence',
    sentenceDate: '2022-03-10',
    terms: [{ years: 0, months: 2, weeks: 0, days: 0, code: 'IMP' }],
    offences: [
      {
        offenderChargeId: 3932804,
        offenceStartDate: '2022-02-10',
        offenceCode: 'SX03200',
        offenceDescription:
          'Adult abuse position of trust - cause child 13 - 17 watch a sexual act cared for in s.21 premises - SOA 2003',
        indicators: ['ERS', 'S', '24', 'S15/CJIB', 'PIMMS3', 'S1', 'M', 'V', 'H', 'PIMMS1', 'SOR'],
      },
    ],
  },
  {
    bookingId: 1202003,
    sentenceSequence: 4,
    consecutiveToSequence: 3,
    lineSequence: 4,
    caseSequence: 1,
    courtDescription: 'Abergavenny Magistrates Court',
    sentenceStatus: 'A',
    sentenceCategory: '2020',
    sentenceCalculationType: 'ADIMP_ORA',
    sentenceTypeDescription: 'ORA Sentencing Code Standard Determinate Sentence',
    sentenceDate: '2022-03-10',
    terms: [{ years: 0, months: 2, weeks: 0, days: 0, code: 'IMP' }],
    offences: [
      {
        offenderChargeId: 3932806,
        offenceStartDate: '2022-02-10',
        offenceCode: 'RC86374',
        offenceDescription: 'Additional braking device insecure',
        indicators: ['101'],
      },
    ],
  },
  {
    bookingId: 1202076,
    sentenceSequence: 5,
    lineSequence: 1,
    caseSequence: 1,
    courtDescription: 'Bolton Youth Court',
    sentenceStatus: 'A',
    sentenceCategory: '2003',
    sentenceCalculationType: 'FTR',
    sentenceTypeDescription: 'Fixed Term Recall Pre ORA Sentence',
    sentenceDate: '2020-01-03',
    terms: [{ years: 0, months: 0, weeks: 0, days: 876, code: 'IMP' }],
    offences: [
      {
        offenderChargeId: 3932857,
        offenceStartDate: '2019-09-19',
        offenceCode: 'RT88513',
        offenceDescription: 'Ride in a rear passenger seat in a motor vehicle on a road and fail to wear seat belt',
        indicators: [],
      },
    ],
  },
  {
    bookingId: 1202076,
    sentenceSequence: 6,
    lineSequence: 2,
    caseSequence: 1,
    courtDescription: 'Bolton Youth Court',
    sentenceStatus: 'A',
    sentenceCategory: '2020',
    sentenceCalculationType: 'ADIMP',
    sentenceTypeDescription: 'Sentencing Code Standard Determinate Sentence',
    sentenceDate: '2022-02-03',
    terms: [{ years: 0, months: 0, weeks: 0, days: 876, code: 'IMP' }],
    offences: [
      {
        offenderChargeId: 3932858,
        offenceStartDate: '2021-11-29',
        offenceCode: 'SX03224A',
        offenceDescription: 'Adult attempt to engage in sexual communication with a child',
        indicators: ['99'],
      },
    ],
  },
  {
    bookingId: 1202076,
    sentenceSequence: 6,
    lineSequence: 2,
    caseSequence: 1,
    courtDescription: 'Bolton Youth Court',
    sentenceStatus: 'A',
    sentenceCategory: '2020',
    sentenceCalculationType: 'A/FINE',
    sentenceTypeDescription: 'Imprisonment in Default of Fine',
    sentenceDate: '2022-02-03',
    terms: [{ years: 0, months: 0, weeks: 0, days: 876, code: 'IMP' }],
    offences: [
      {
        offenderChargeId: 3550166,
        offenceStartDate: '2015-07-24',
        offenceCode: 'ZZ01008',
        offenceDescription: 'CIVIL : Other Non-Payment',
        indicators: ['700'],
      },
    ],
  },
] as PrisonApiOffenderSentenceAndOffences[]

const adjustments = {
  sentenceAdjustments: [
    {
      sentenceSequence: 1,
      type: 'RECALL_SENTENCE_REMAND',
      numberOfDays: 3,
      fromDate: null,
      toDate: null,
      active: true,
    },
    {
      sentenceSequence: 1,
      type: 'REMAND',
      numberOfDays: 1,
      fromDate: '2022-01-06',
      toDate: '2022-01-06',
      active: true,
    },
  ],
  bookingAdjustments: [],
} as PrisonApiBookingAndSentenceAdjustments

const returnToCustody = { bookingId: 1202076, returnToCustodyDate: '2022-01-07' }

const calculation = {
  dates: {
    SED: '2022-01-01',
    LED: '2022-01-06',
    ARD: '2022-01-02',
    CRD: '2022-01-03',
    HDCED: '2022-01-07',
    ESED: '2022-01-20',
    DPRRD: '2022-01-18',
    ETD: '2022-01-13',
    LTD: '2022-01-15',
    MTD: '2022-01-14',
    NPD: '2022-01-04',
    PED: '2022-01-08',
    PRRD: '2022-01-05',
    TUSED: '2022-01-16',
    ERSED: '2022-11-11',
  },
  calculationRequestId: 3819,
  bookingId: 1202076,
  prisonerId: 'A8541DY',
  calculationStatus: 'PRELIMINARY',
  calculationFragments: null,
  effectiveSentenceLength: 'P4Y5M25D',
} as BookingCalculation

const payments = [
  {
    bookingId: 1202076,
    paymentDate: '2022-01-01',
    paymentAmount: 100.99,
  },
] as PrisonApiOffenderFinePayment[]

const questions = {
  sentenceQuestions: [
    {
      sentenceSequence: 1,
      userInputType: 'FOUR_TO_UNDER_SEVEN',
    } as CalculationSentenceQuestion,
    {
      sentenceSequence: 3,
      userInputType: 'ORIGINAL',
    } as CalculationSentenceQuestion,
  ],
} as CalculationUserQuestions

const calculateReleaseDatesService = new CalculateReleaseDatesService() as jest.Mocked<CalculateReleaseDatesService>
const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const oneThousandCalculationsService = new OneThousandCalculationsService(prisonerService, calculateReleaseDatesService)

describe('Calculate release dates service tests', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('OneThousandCalculationsService tests', () => {
    it('Test that successful calculations will return a CSV row', async () => {
      prisonerService.getPrisonerDetailIncludingReleased.mockResolvedValue(prisoner)
      prisonerService.getSentenceDetail.mockResolvedValue(nomisDates)
      prisonerService.getOffenderKeyDates.mockResolvedValue(keyDates)
      prisonerService.getSentencesAndOffences.mockResolvedValue(sentenceAndOffences)
      prisonerService.getBookingAndSentenceAdjustments.mockResolvedValue(adjustments)
      prisonerService.getReturnToCustodyDate.mockResolvedValue(returnToCustody)
      prisonerService.getOffenderFinePayments.mockResolvedValue(payments)
      calculateReleaseDatesService.calculateTestReleaseDates.mockResolvedValue({
        calculatedReleaseDates: calculation,
        validationMessages: [],
      })
      calculateReleaseDatesService.getCalculationBreakdown.mockResolvedValue(pedAdjustedByCrdAndBeforePrrdBreakdown())
      calculateReleaseDatesService.getCalculationUserQuestions.mockResolvedValue(questions)

      const rows = await oneThousandCalculationsService.runCalculations('', [], '', ['ABCDEFG'])

      const expected = {
        NOMS_ID: 'ABCDEFG',
        DOB: '1978-04-30',
        REQUEST_ID: 3819,
        CALCULATED_DATES:
          '{"SED":"2022-01-01","LED":"2022-01-06","ARD":"2022-01-02","CRD":"2022-01-03","HDCED":"2022-01-07","ESED":"2022-01-20","DPRRD":"2022-01-18","ETD":"2022-01-13","LTD":"2022-01-15","MTD":"2022-01-14","NPD":"2022-01-04","PED":"2022-01-08","PRRD":"2022-01-05","TUSED":"2022-01-16","ERSED":"2022-11-11"}',
        CRD: '2022-01-03',
        NOMIS_CRD: '2022-01-03',
        NOMIS_CRD_OVERRIDE: '2022-01-23',
        CRD_MATCH: 'Y',
        LED: '2022-01-06',
        NOMIS_LED: '2022-01-06',
        NOMIS_LED_CALCULATED: '2022-01-30',
        NOMIS_LED_OVERRIDE: '2022-01-31',
        LED_MATCH: 'Y',
        SED: '2022-01-01',
        NOMIS_SED: '2022-01-01',
        NOMIS_SED_CALCULATED: '2022-01-28',
        NOMIS_SED_OVERRIDE: '2022-01-29',
        SED_MATCH: 'Y',
        NOMIS_NPD: '2022-01-04',
        NOMIS_NPD_OVERRIDE: '2022-01-24',
        NPD_MATCH: 'Y',
        NOMIS_ARD: '2022-01-02',
        NOMIS_ARD_OVERRIDE: '2022-01-22',
        ARD_MATCH: 'Y',
        NOMIS_TUSED: '2022-01-16',
        NOMIS_TUSED_CALCULATED: '2022-02-09',
        NOMIS_TUSED_OVERRIDE: '2022-02-10',
        TUSED_MATCH: 'Y',
        NOMIS_PED: '2022-01-08',
        NOMIS_PED_CALCULATED: '2022-02-01',
        NOMIS_PED_OVERRIDE: '2022-02-02',
        PED_MATCH: 'Y',
        HDCED: '2022-01-07',
        NOMIS_HDCED: '2022-01-07',
        NOMIS_HDCED_CALCULATED: '2022-02-07',
        NOMIS_HDCED_OVERRIDE: '2022-02-08',
        HDCED_MATCH: 'Y',
        NOMIS_ETD: '2022-01-13',
        NOMIS_MTD: '2022-01-14',
        NOMIS_LTD: '2022-01-15',
        NOMIS_DPRRD: '2022-01-18',
        NOMIS_DPRRD_OVERRIDE: '2022-01-26',
        NOMIS_PRRD: '2022-01-05',
        NOMIS_PRRD_OVERRIDE: '2022-01-25',
        PRRD_MATCH: 'Y',
        ESED: '2022-01-20',
        NOMIS_ESED: '2022-01-20',
        ERSED: '2022-11-11',
        NOMIS_ERSED: '2022-11-11',
        ERSED_MATCH: 'Y',
        NOMIS_ROTL: '2022-11-12',
        SENTENCE_LENGTH: '04/05/25',
        NOMIS_ESL: '04/05/26',
        NOMIS_JSL: '04/05/25',
        REASON_CODE: 'NEW',
        COMMENT: 'This is a NOMIS calculation',
        IS_ESL_SAME: 'N',
        IS_JSL_SAME: 'Y',
        IS_PED_ADJUSTED_TO_CRD: 'Y',
        IS_HDCED_14_DAY_RULE: 'Y',
        HAS_SDS_PLUS_PCSC: 'Y',
        SEX_OFFENDER: 'Y',
        LOCATION: 'Kirkham (HMP)',
        SENTENCES:
          '[{"bookingId":1202003,"sentenceSequence":1,"lineSequence":1,"caseSequence":1,"courtDescription":"Abergavenny Magistrates Court","sentenceStatus":"A","sentenceCategory":"2003","sentenceCalculationType":"ADIMP","sentenceTypeDescription":"CJA03 Standard Determinate Sentence","sentenceDate":"2022-03-10","terms":[{"years":0,"months":3,"weeks":0,"days":0,"code":"IMP"}],"offences":[{"offenderChargeId":3932803,"offenceStartDate":"2012-02-10","offenceCode":"TH68010A","offenceDescription":"Attempt theft from shop","indicators":["D","50"]}]},{"bookingId":1202003,"sentenceSequence":2,"consecutiveToSequence":1,"lineSequence":2,"caseSequence":1,"courtDescription":"Abergavenny Magistrates Court","sentenceStatus":"A","sentenceCategory":"2003","sentenceCalculationType":"ADIMP","sentenceTypeDescription":"CJA03 Standard Determinate Sentence","sentenceDate":"2022-03-10","terms":[{"years":0,"months":3,"weeks":0,"days":0,"code":"IMP"}],"offences":[{"offenderChargeId":3932805,"offenceStartDate":"2012-02-10","offenceCode":"AW06049","offenceDescription":"Administer a poisonous / injurious drug / substance to a protected animal","indicators":["113","99"]}]},{"bookingId":1202003,"sentenceSequence":3,"consecutiveToSequence":2,"lineSequence":3,"caseSequence":1,"courtDescription":"Abergavenny Magistrates Court","sentenceStatus":"A","sentenceCategory":"2003","sentenceCalculationType":"ADIMP_ORA","sentenceTypeDescription":"ORA CJA03 Standard Determinate Sentence","sentenceDate":"2022-03-10","terms":[{"years":0,"months":2,"weeks":0,"days":0,"code":"IMP"}],"offences":[{"offenderChargeId":3932804,"offenceStartDate":"2022-02-10","offenceCode":"SX03200","offenceDescription":"Adult abuse position of trust - cause child 13 - 17 watch a sexual act cared for in s.21 premises - SOA 2003","indicators":["ERS","S","24","S15/CJIB","PIMMS3","S1","M","V","H","PIMMS1","SOR"]}]},{"bookingId":1202003,"sentenceSequence":4,"consecutiveToSequence":3,"lineSequence":4,"caseSequence":1,"courtDescription":"Abergavenny Magistrates Court","sentenceStatus":"A","sentenceCategory":"2020","sentenceCalculationType":"ADIMP_ORA","sentenceTypeDescription":"ORA Sentencing Code Standard Determinate Sentence","sentenceDate":"2022-03-10","terms":[{"years":0,"months":2,"weeks":0,"days":0,"code":"IMP"}],"offences":[{"offenderChargeId":3932806,"offenceStartDate":"2022-02-10","offenceCode":"RC86374","offenceDescription":"Additional braking device insecure","indicators":["101"]}]},{"bookingId":1202076,"sentenceSequence":5,"lineSequence":1,"caseSequence":1,"courtDescription":"Bolton Youth Court","sentenceStatus":"A","sentenceCategory":"2003","sentenceCalculationType":"FTR","sentenceTypeDescription":"Fixed Term Recall Pre ORA Sentence","sentenceDate":"2020-01-03","terms":[{"years":0,"months":0,"weeks":0,"days":876,"code":"IMP"}],"offences":[{"offenderChargeId":3932857,"offenceStartDate":"2019-09-19","offenceCode":"RT88513","offenceDescription":"Ride in a rear passenger seat in a motor vehicle on a road and fail to wear seat belt","indicators":[]}]},{"bookingId":1202076,"sentenceSequence":6,"lineSequence":2,"caseSequence":1,"courtDescription":"Bolton Youth Court","sentenceStatus":"A","sentenceCategory":"2020","sentenceCalculationType":"ADIMP","sentenceTypeDescription":"Sentencing Code Standard Determinate Sentence","sentenceDate":"2022-02-03","terms":[{"years":0,"months":0,"weeks":0,"days":876,"code":"IMP"}],"offences":[{"offenderChargeId":3932858,"offenceStartDate":"2021-11-29","offenceCode":"SX03224A","offenceDescription":"Adult attempt to engage in sexual communication with a child","indicators":["99"]}]},{"bookingId":1202076,"sentenceSequence":6,"lineSequence":2,"caseSequence":1,"courtDescription":"Bolton Youth Court","sentenceStatus":"A","sentenceCategory":"2020","sentenceCalculationType":"A/FINE","sentenceTypeDescription":"Imprisonment in Default of Fine","sentenceDate":"2022-02-03","terms":[{"years":0,"months":0,"weeks":0,"days":876,"code":"IMP"}],"offences":[{"offenderChargeId":3550166,"offenceStartDate":"2015-07-24","offenceCode":"ZZ01008","offenceDescription":"CIVIL : Other Non-Payment","indicators":["700"]}]}]',
        ADJUSTMENTS:
          '{"sentenceAdjustments":[{"sentenceSequence":1,"type":"RECALL_SENTENCE_REMAND","numberOfDays":3,"fromDate":null,"toDate":null,"active":true},{"sentenceSequence":1,"type":"REMAND","numberOfDays":1,"fromDate":"2022-01-06","toDate":"2022-01-06","active":true}],"bookingAdjustments":[]}',
        RETURN_TO_CUSTODY: '{"bookingId":1202076,"returnToCustodyDate":"2022-01-07"}',
        FINE_PAYMENTS: '[{"bookingId":1202076,"paymentDate":"2022-01-01","paymentAmount":100.99}]',
        CONSECUTIVE_SENTENCES:
          '[{"bookingId":1202003,"sentenceSequence":1,"lineSequence":1,"caseSequence":1,"courtDescription":"Abergavenny Magistrates Court","sentenceStatus":"A","sentenceCategory":"2003","sentenceCalculationType":"ADIMP","sentenceTypeDescription":"CJA03 Standard Determinate Sentence","sentenceDate":"2022-03-10","terms":[{"years":0,"months":3,"weeks":0,"days":0,"code":"IMP"}],"offences":[{"offenderChargeId":3932803,"offenceStartDate":"2012-02-10","offenceCode":"TH68010A","offenceDescription":"Attempt theft from shop","indicators":["D","50"]}]},{"bookingId":1202003,"sentenceSequence":2,"consecutiveToSequence":1,"lineSequence":2,"caseSequence":1,"courtDescription":"Abergavenny Magistrates Court","sentenceStatus":"A","sentenceCategory":"2003","sentenceCalculationType":"ADIMP","sentenceTypeDescription":"CJA03 Standard Determinate Sentence","sentenceDate":"2022-03-10","terms":[{"years":0,"months":3,"weeks":0,"days":0,"code":"IMP"}],"offences":[{"offenderChargeId":3932805,"offenceStartDate":"2012-02-10","offenceCode":"AW06049","offenceDescription":"Administer a poisonous / injurious drug / substance to a protected animal","indicators":["113","99"]}]},{"bookingId":1202003,"sentenceSequence":3,"consecutiveToSequence":2,"lineSequence":3,"caseSequence":1,"courtDescription":"Abergavenny Magistrates Court","sentenceStatus":"A","sentenceCategory":"2003","sentenceCalculationType":"ADIMP_ORA","sentenceTypeDescription":"ORA CJA03 Standard Determinate Sentence","sentenceDate":"2022-03-10","terms":[{"years":0,"months":2,"weeks":0,"days":0,"code":"IMP"}],"offences":[{"offenderChargeId":3932804,"offenceStartDate":"2022-02-10","offenceCode":"SX03200","offenceDescription":"Adult abuse position of trust - cause child 13 - 17 watch a sexual act cared for in s.21 premises - SOA 2003","indicators":["ERS","S","24","S15/CJIB","PIMMS3","S1","M","V","H","PIMMS1","SOR"]}]},{"bookingId":1202003,"sentenceSequence":4,"consecutiveToSequence":3,"lineSequence":4,"caseSequence":1,"courtDescription":"Abergavenny Magistrates Court","sentenceStatus":"A","sentenceCategory":"2020","sentenceCalculationType":"ADIMP_ORA","sentenceTypeDescription":"ORA Sentencing Code Standard Determinate Sentence","sentenceDate":"2022-03-10","terms":[{"years":0,"months":2,"weeks":0,"days":0,"code":"IMP"}],"offences":[{"offenderChargeId":3932806,"offenceStartDate":"2022-02-10","offenceCode":"RC86374","offenceDescription":"Additional braking device insecure","indicators":["101"]}]}]',
        DPRRD: '2022-01-18',
        ETD: '2022-01-13',
        LTD: '2022-01-15',
        MTD: '2022-01-14',
        NPD: '2022-01-04',
        PED: '2022-01-08',
        PRRD: '2022-01-05',
        TUSED: '2022-01-16',
        ARD: '2022-01-02',
        ERROR_JSON: undefined,
        ERROR_TEXT: undefined,
      } as OneThousandCalculationsRow

      expect(rows[0]).toStrictEqual(expected)
    })
    it('Test that a validation calculation error will return a CSV row', async () => {
      prisonerService.getPrisonerDetailIncludingReleased.mockResolvedValue(prisoner)
      prisonerService.getSentenceDetail.mockResolvedValue(nomisDates)
      prisonerService.getOffenderKeyDates.mockResolvedValue(keyDates)
      prisonerService.getSentencesAndOffences.mockResolvedValue(sentenceAndOffences)
      prisonerService.getBookingAndSentenceAdjustments.mockResolvedValue(adjustments)
      prisonerService.getReturnToCustodyDate.mockResolvedValue(returnToCustody)
      prisonerService.getOffenderFinePayments.mockResolvedValue(payments)
      calculateReleaseDatesService.calculateTestReleaseDates.mockResolvedValue({
        calculatedReleaseDates: null,
        validationMessages: [
          {
            code: 'OFFENCE_MISSING_DATE',
            message: 'There was an error',
            arguments: [],
            type: 'VALIDATION',
          },
        ],
      })
      calculateReleaseDatesService.getCalculationUserQuestions.mockResolvedValue(questions)

      const rows = await oneThousandCalculationsService.runCalculations('', [], '', ['ABCDEFG'])

      const expected = {
        NOMS_ID: 'ABCDEFG',
        DOB: '1978-04-30',
        REQUEST_ID: undefined,
        CALCULATED_DATES: undefined,
        CRD: 'Validation Error',
        NOMIS_CRD: '2022-01-03',
        NOMIS_CRD_OVERRIDE: '2022-01-23',
        CRD_MATCH: '',
        LED: 'Validation Error',
        NOMIS_LED: '2022-01-06',
        NOMIS_LED_CALCULATED: '2022-01-30',
        NOMIS_LED_OVERRIDE: '2022-01-31',
        LED_MATCH: '',
        SED: 'Validation Error',
        NOMIS_SED: '2022-01-01',
        NOMIS_SED_CALCULATED: '2022-01-28',
        NOMIS_SED_OVERRIDE: '2022-01-29',
        SED_MATCH: '',
        NOMIS_NPD: '2022-01-04',
        NOMIS_NPD_OVERRIDE: '2022-01-24',
        NPD_MATCH: '',
        NOMIS_ARD: '2022-01-02',
        NOMIS_ARD_OVERRIDE: '2022-01-22',
        ARD_MATCH: '',
        NOMIS_TUSED: '2022-01-16',
        NOMIS_TUSED_CALCULATED: '2022-02-09',
        NOMIS_TUSED_OVERRIDE: '2022-02-10',
        TUSED_MATCH: '',
        NOMIS_PED: '2022-01-08',
        NOMIS_PED_CALCULATED: '2022-02-01',
        NOMIS_PED_OVERRIDE: '2022-02-02',
        PED_MATCH: '',
        HDCED: 'Validation Error',
        NOMIS_HDCED: '2022-01-07',
        NOMIS_HDCED_CALCULATED: '2022-02-07',
        NOMIS_HDCED_OVERRIDE: '2022-02-08',
        HDCED_MATCH: '',
        NOMIS_ETD: '2022-01-13',
        NOMIS_MTD: '2022-01-14',
        NOMIS_LTD: '2022-01-15',
        NOMIS_DPRRD: '2022-01-18',
        NOMIS_DPRRD_OVERRIDE: '2022-01-26',
        NOMIS_PRRD: '2022-01-05',
        NOMIS_PRRD_OVERRIDE: '2022-01-25',
        PRRD_MATCH: '',
        ESED: 'Validation Error',
        NOMIS_ESED: '2022-01-20',
        SENTENCE_LENGTH: '',
        NOMIS_ESL: '04/05/26',
        NOMIS_JSL: '04/05/25',
        REASON_CODE: 'NEW',
        COMMENT: 'This is a NOMIS calculation',
        IS_ESL_SAME: 'N',
        IS_JSL_SAME: 'N',
        HAS_SDS_PLUS_PCSC: 'Y',
        IS_HDCED_14_DAY_RULE: '',
        ERSED: 'Validation Error',
        NOMIS_ERSED: '2022-11-11',
        ERSED_MATCH: '',
        NOMIS_ROTL: '2022-11-12',
        IS_PED_ADJUSTED_TO_CRD: '',
        SEX_OFFENDER: 'Y',
        LOCATION: 'Kirkham (HMP)',
        SENTENCES:
          '[{"bookingId":1202003,"sentenceSequence":1,"lineSequence":1,"caseSequence":1,"courtDescription":"Abergavenny Magistrates Court","sentenceStatus":"A","sentenceCategory":"2003","sentenceCalculationType":"ADIMP","sentenceTypeDescription":"CJA03 Standard Determinate Sentence","sentenceDate":"2022-03-10","terms":[{"years":0,"months":3,"weeks":0,"days":0,"code":"IMP"}],"offences":[{"offenderChargeId":3932803,"offenceStartDate":"2012-02-10","offenceCode":"TH68010A","offenceDescription":"Attempt theft from shop","indicators":["D","50"]}]},{"bookingId":1202003,"sentenceSequence":2,"consecutiveToSequence":1,"lineSequence":2,"caseSequence":1,"courtDescription":"Abergavenny Magistrates Court","sentenceStatus":"A","sentenceCategory":"2003","sentenceCalculationType":"ADIMP","sentenceTypeDescription":"CJA03 Standard Determinate Sentence","sentenceDate":"2022-03-10","terms":[{"years":0,"months":3,"weeks":0,"days":0,"code":"IMP"}],"offences":[{"offenderChargeId":3932805,"offenceStartDate":"2012-02-10","offenceCode":"AW06049","offenceDescription":"Administer a poisonous / injurious drug / substance to a protected animal","indicators":["113","99"]}]},{"bookingId":1202003,"sentenceSequence":3,"consecutiveToSequence":2,"lineSequence":3,"caseSequence":1,"courtDescription":"Abergavenny Magistrates Court","sentenceStatus":"A","sentenceCategory":"2003","sentenceCalculationType":"ADIMP_ORA","sentenceTypeDescription":"ORA CJA03 Standard Determinate Sentence","sentenceDate":"2022-03-10","terms":[{"years":0,"months":2,"weeks":0,"days":0,"code":"IMP"}],"offences":[{"offenderChargeId":3932804,"offenceStartDate":"2022-02-10","offenceCode":"SX03200","offenceDescription":"Adult abuse position of trust - cause child 13 - 17 watch a sexual act cared for in s.21 premises - SOA 2003","indicators":["ERS","S","24","S15/CJIB","PIMMS3","S1","M","V","H","PIMMS1","SOR"]}]},{"bookingId":1202003,"sentenceSequence":4,"consecutiveToSequence":3,"lineSequence":4,"caseSequence":1,"courtDescription":"Abergavenny Magistrates Court","sentenceStatus":"A","sentenceCategory":"2020","sentenceCalculationType":"ADIMP_ORA","sentenceTypeDescription":"ORA Sentencing Code Standard Determinate Sentence","sentenceDate":"2022-03-10","terms":[{"years":0,"months":2,"weeks":0,"days":0,"code":"IMP"}],"offences":[{"offenderChargeId":3932806,"offenceStartDate":"2022-02-10","offenceCode":"RC86374","offenceDescription":"Additional braking device insecure","indicators":["101"]}]},{"bookingId":1202076,"sentenceSequence":5,"lineSequence":1,"caseSequence":1,"courtDescription":"Bolton Youth Court","sentenceStatus":"A","sentenceCategory":"2003","sentenceCalculationType":"FTR","sentenceTypeDescription":"Fixed Term Recall Pre ORA Sentence","sentenceDate":"2020-01-03","terms":[{"years":0,"months":0,"weeks":0,"days":876,"code":"IMP"}],"offences":[{"offenderChargeId":3932857,"offenceStartDate":"2019-09-19","offenceCode":"RT88513","offenceDescription":"Ride in a rear passenger seat in a motor vehicle on a road and fail to wear seat belt","indicators":[]}]},{"bookingId":1202076,"sentenceSequence":6,"lineSequence":2,"caseSequence":1,"courtDescription":"Bolton Youth Court","sentenceStatus":"A","sentenceCategory":"2020","sentenceCalculationType":"ADIMP","sentenceTypeDescription":"Sentencing Code Standard Determinate Sentence","sentenceDate":"2022-02-03","terms":[{"years":0,"months":0,"weeks":0,"days":876,"code":"IMP"}],"offences":[{"offenderChargeId":3932858,"offenceStartDate":"2021-11-29","offenceCode":"SX03224A","offenceDescription":"Adult attempt to engage in sexual communication with a child","indicators":["99"]}]},{"bookingId":1202076,"sentenceSequence":6,"lineSequence":2,"caseSequence":1,"courtDescription":"Bolton Youth Court","sentenceStatus":"A","sentenceCategory":"2020","sentenceCalculationType":"A/FINE","sentenceTypeDescription":"Imprisonment in Default of Fine","sentenceDate":"2022-02-03","terms":[{"years":0,"months":0,"weeks":0,"days":876,"code":"IMP"}],"offences":[{"offenderChargeId":3550166,"offenceStartDate":"2015-07-24","offenceCode":"ZZ01008","offenceDescription":"CIVIL : Other Non-Payment","indicators":["700"]}]}]',
        ADJUSTMENTS:
          '{"sentenceAdjustments":[{"sentenceSequence":1,"type":"RECALL_SENTENCE_REMAND","numberOfDays":3,"fromDate":null,"toDate":null,"active":true},{"sentenceSequence":1,"type":"REMAND","numberOfDays":1,"fromDate":"2022-01-06","toDate":"2022-01-06","active":true}],"bookingAdjustments":[]}',
        RETURN_TO_CUSTODY: '{"bookingId":1202076,"returnToCustodyDate":"2022-01-07"}',
        FINE_PAYMENTS: '[{"bookingId":1202076,"paymentDate":"2022-01-01","paymentAmount":100.99}]',
        CONSECUTIVE_SENTENCES:
          '[{"bookingId":1202003,"sentenceSequence":1,"lineSequence":1,"caseSequence":1,"courtDescription":"Abergavenny Magistrates Court","sentenceStatus":"A","sentenceCategory":"2003","sentenceCalculationType":"ADIMP","sentenceTypeDescription":"CJA03 Standard Determinate Sentence","sentenceDate":"2022-03-10","terms":[{"years":0,"months":3,"weeks":0,"days":0,"code":"IMP"}],"offences":[{"offenderChargeId":3932803,"offenceStartDate":"2012-02-10","offenceCode":"TH68010A","offenceDescription":"Attempt theft from shop","indicators":["D","50"]}]},{"bookingId":1202003,"sentenceSequence":2,"consecutiveToSequence":1,"lineSequence":2,"caseSequence":1,"courtDescription":"Abergavenny Magistrates Court","sentenceStatus":"A","sentenceCategory":"2003","sentenceCalculationType":"ADIMP","sentenceTypeDescription":"CJA03 Standard Determinate Sentence","sentenceDate":"2022-03-10","terms":[{"years":0,"months":3,"weeks":0,"days":0,"code":"IMP"}],"offences":[{"offenderChargeId":3932805,"offenceStartDate":"2012-02-10","offenceCode":"AW06049","offenceDescription":"Administer a poisonous / injurious drug / substance to a protected animal","indicators":["113","99"]}]},{"bookingId":1202003,"sentenceSequence":3,"consecutiveToSequence":2,"lineSequence":3,"caseSequence":1,"courtDescription":"Abergavenny Magistrates Court","sentenceStatus":"A","sentenceCategory":"2003","sentenceCalculationType":"ADIMP_ORA","sentenceTypeDescription":"ORA CJA03 Standard Determinate Sentence","sentenceDate":"2022-03-10","terms":[{"years":0,"months":2,"weeks":0,"days":0,"code":"IMP"}],"offences":[{"offenderChargeId":3932804,"offenceStartDate":"2022-02-10","offenceCode":"SX03200","offenceDescription":"Adult abuse position of trust - cause child 13 - 17 watch a sexual act cared for in s.21 premises - SOA 2003","indicators":["ERS","S","24","S15/CJIB","PIMMS3","S1","M","V","H","PIMMS1","SOR"]}]},{"bookingId":1202003,"sentenceSequence":4,"consecutiveToSequence":3,"lineSequence":4,"caseSequence":1,"courtDescription":"Abergavenny Magistrates Court","sentenceStatus":"A","sentenceCategory":"2020","sentenceCalculationType":"ADIMP_ORA","sentenceTypeDescription":"ORA Sentencing Code Standard Determinate Sentence","sentenceDate":"2022-03-10","terms":[{"years":0,"months":2,"weeks":0,"days":0,"code":"IMP"}],"offences":[{"offenderChargeId":3932806,"offenceStartDate":"2022-02-10","offenceCode":"RC86374","offenceDescription":"Additional braking device insecure","indicators":["101"]}]}]',

        DPRRD: 'Validation Error',
        ETD: 'Validation Error',
        LTD: 'Validation Error',
        MTD: 'Validation Error',
        NPD: 'Validation Error',
        PED: 'Validation Error',
        PRRD: 'Validation Error',
        TUSED: 'Validation Error',
        ARD: 'Validation Error',
        ERROR_JSON: '{"message":"There was an error\\r\\n"}',
        ERROR_TEXT: 'There was an error\r\n',
      } as OneThousandCalculationsRow

      expect(rows[0]).toStrictEqual(expected)
    })

    it('Test that an unexpected calculation error will return a CSV row', async () => {
      prisonerService.getPrisonerDetailIncludingReleased.mockResolvedValue(prisoner)
      prisonerService.getSentenceDetail.mockResolvedValue(nomisDates)
      prisonerService.getOffenderKeyDates.mockResolvedValue(keyDates)
      prisonerService.getSentencesAndOffences.mockResolvedValue(sentenceAndOffences)
      prisonerService.getBookingAndSentenceAdjustments.mockResolvedValue(adjustments)
      prisonerService.getReturnToCustodyDate.mockResolvedValue(returnToCustody)
      prisonerService.getOffenderFinePayments.mockResolvedValue(payments)
      calculateReleaseDatesService.calculateTestReleaseDates.mockRejectedValue({
        status: 500,
        message: 'There was an unexpected error',
      })
      calculateReleaseDatesService.getCalculationUserQuestions.mockResolvedValue(questions)

      const rows = await oneThousandCalculationsService.runCalculations('', [], '', ['ABCDEFG'])

      const expected = {
        NOMS_ID: 'ABCDEFG',
        DOB: '1978-04-30',
        REQUEST_ID: undefined,
        CALCULATED_DATES: undefined,
        CRD: 'Server error',
        NOMIS_CRD: '2022-01-03',
        NOMIS_CRD_OVERRIDE: '2022-01-23',
        CRD_MATCH: '',
        LED: 'Server error',
        NOMIS_LED: '2022-01-06',
        NOMIS_LED_CALCULATED: '2022-01-30',
        NOMIS_LED_OVERRIDE: '2022-01-31',
        LED_MATCH: '',
        SED: 'Server error',
        NOMIS_SED: '2022-01-01',
        NOMIS_SED_CALCULATED: '2022-01-28',
        NOMIS_SED_OVERRIDE: '2022-01-29',
        SED_MATCH: '',
        NOMIS_NPD: '2022-01-04',
        NOMIS_NPD_OVERRIDE: '2022-01-24',
        NPD_MATCH: '',
        NOMIS_ARD: '2022-01-02',
        NOMIS_ARD_OVERRIDE: '2022-01-22',
        ARD_MATCH: '',
        NOMIS_TUSED: '2022-01-16',
        NOMIS_TUSED_CALCULATED: '2022-02-09',
        NOMIS_TUSED_OVERRIDE: '2022-02-10',
        TUSED_MATCH: '',
        NOMIS_PED: '2022-01-08',
        NOMIS_PED_CALCULATED: '2022-02-01',
        NOMIS_PED_OVERRIDE: '2022-02-02',
        PED_MATCH: '',
        HDCED: 'Server error',
        NOMIS_HDCED: '2022-01-07',
        NOMIS_HDCED_CALCULATED: '2022-02-07',
        NOMIS_HDCED_OVERRIDE: '2022-02-08',
        HDCED_MATCH: '',
        NOMIS_ETD: '2022-01-13',
        NOMIS_MTD: '2022-01-14',
        NOMIS_LTD: '2022-01-15',
        NOMIS_DPRRD: '2022-01-18',
        NOMIS_DPRRD_OVERRIDE: '2022-01-26',
        NOMIS_PRRD: '2022-01-05',
        NOMIS_PRRD_OVERRIDE: '2022-01-25',
        PRRD_MATCH: '',
        ESED: 'Server error',
        NOMIS_ESED: '2022-01-20',
        SENTENCE_LENGTH: '',
        NOMIS_ESL: '04/05/26',
        NOMIS_JSL: '04/05/25',
        IS_ESL_SAME: 'N',
        IS_JSL_SAME: 'N',
        HAS_SDS_PLUS_PCSC: 'Y',
        IS_HDCED_14_DAY_RULE: '',
        IS_PED_ADJUSTED_TO_CRD: '',
        SEX_OFFENDER: 'Y',
        ERSED: 'Server error',
        NOMIS_ERSED: '2022-11-11',
        ERSED_MATCH: '',
        NOMIS_ROTL: '2022-11-12',
        LOCATION: 'Kirkham (HMP)',
        REASON_CODE: 'NEW',
        COMMENT: 'This is a NOMIS calculation',
        SENTENCES:
          '[{"bookingId":1202003,"sentenceSequence":1,"lineSequence":1,"caseSequence":1,"courtDescription":"Abergavenny Magistrates Court","sentenceStatus":"A","sentenceCategory":"2003","sentenceCalculationType":"ADIMP","sentenceTypeDescription":"CJA03 Standard Determinate Sentence","sentenceDate":"2022-03-10","terms":[{"years":0,"months":3,"weeks":0,"days":0,"code":"IMP"}],"offences":[{"offenderChargeId":3932803,"offenceStartDate":"2012-02-10","offenceCode":"TH68010A","offenceDescription":"Attempt theft from shop","indicators":["D","50"]}]},{"bookingId":1202003,"sentenceSequence":2,"consecutiveToSequence":1,"lineSequence":2,"caseSequence":1,"courtDescription":"Abergavenny Magistrates Court","sentenceStatus":"A","sentenceCategory":"2003","sentenceCalculationType":"ADIMP","sentenceTypeDescription":"CJA03 Standard Determinate Sentence","sentenceDate":"2022-03-10","terms":[{"years":0,"months":3,"weeks":0,"days":0,"code":"IMP"}],"offences":[{"offenderChargeId":3932805,"offenceStartDate":"2012-02-10","offenceCode":"AW06049","offenceDescription":"Administer a poisonous / injurious drug / substance to a protected animal","indicators":["113","99"]}]},{"bookingId":1202003,"sentenceSequence":3,"consecutiveToSequence":2,"lineSequence":3,"caseSequence":1,"courtDescription":"Abergavenny Magistrates Court","sentenceStatus":"A","sentenceCategory":"2003","sentenceCalculationType":"ADIMP_ORA","sentenceTypeDescription":"ORA CJA03 Standard Determinate Sentence","sentenceDate":"2022-03-10","terms":[{"years":0,"months":2,"weeks":0,"days":0,"code":"IMP"}],"offences":[{"offenderChargeId":3932804,"offenceStartDate":"2022-02-10","offenceCode":"SX03200","offenceDescription":"Adult abuse position of trust - cause child 13 - 17 watch a sexual act cared for in s.21 premises - SOA 2003","indicators":["ERS","S","24","S15/CJIB","PIMMS3","S1","M","V","H","PIMMS1","SOR"]}]},{"bookingId":1202003,"sentenceSequence":4,"consecutiveToSequence":3,"lineSequence":4,"caseSequence":1,"courtDescription":"Abergavenny Magistrates Court","sentenceStatus":"A","sentenceCategory":"2020","sentenceCalculationType":"ADIMP_ORA","sentenceTypeDescription":"ORA Sentencing Code Standard Determinate Sentence","sentenceDate":"2022-03-10","terms":[{"years":0,"months":2,"weeks":0,"days":0,"code":"IMP"}],"offences":[{"offenderChargeId":3932806,"offenceStartDate":"2022-02-10","offenceCode":"RC86374","offenceDescription":"Additional braking device insecure","indicators":["101"]}]},{"bookingId":1202076,"sentenceSequence":5,"lineSequence":1,"caseSequence":1,"courtDescription":"Bolton Youth Court","sentenceStatus":"A","sentenceCategory":"2003","sentenceCalculationType":"FTR","sentenceTypeDescription":"Fixed Term Recall Pre ORA Sentence","sentenceDate":"2020-01-03","terms":[{"years":0,"months":0,"weeks":0,"days":876,"code":"IMP"}],"offences":[{"offenderChargeId":3932857,"offenceStartDate":"2019-09-19","offenceCode":"RT88513","offenceDescription":"Ride in a rear passenger seat in a motor vehicle on a road and fail to wear seat belt","indicators":[]}]},{"bookingId":1202076,"sentenceSequence":6,"lineSequence":2,"caseSequence":1,"courtDescription":"Bolton Youth Court","sentenceStatus":"A","sentenceCategory":"2020","sentenceCalculationType":"ADIMP","sentenceTypeDescription":"Sentencing Code Standard Determinate Sentence","sentenceDate":"2022-02-03","terms":[{"years":0,"months":0,"weeks":0,"days":876,"code":"IMP"}],"offences":[{"offenderChargeId":3932858,"offenceStartDate":"2021-11-29","offenceCode":"SX03224A","offenceDescription":"Adult attempt to engage in sexual communication with a child","indicators":["99"]}]},{"bookingId":1202076,"sentenceSequence":6,"lineSequence":2,"caseSequence":1,"courtDescription":"Bolton Youth Court","sentenceStatus":"A","sentenceCategory":"2020","sentenceCalculationType":"A/FINE","sentenceTypeDescription":"Imprisonment in Default of Fine","sentenceDate":"2022-02-03","terms":[{"years":0,"months":0,"weeks":0,"days":876,"code":"IMP"}],"offences":[{"offenderChargeId":3550166,"offenceStartDate":"2015-07-24","offenceCode":"ZZ01008","offenceDescription":"CIVIL : Other Non-Payment","indicators":["700"]}]}]',
        ADJUSTMENTS:
          '{"sentenceAdjustments":[{"sentenceSequence":1,"type":"RECALL_SENTENCE_REMAND","numberOfDays":3,"fromDate":null,"toDate":null,"active":true},{"sentenceSequence":1,"type":"REMAND","numberOfDays":1,"fromDate":"2022-01-06","toDate":"2022-01-06","active":true}],"bookingAdjustments":[]}',
        RETURN_TO_CUSTODY: '{"bookingId":1202076,"returnToCustodyDate":"2022-01-07"}',
        FINE_PAYMENTS: '[{"bookingId":1202076,"paymentDate":"2022-01-01","paymentAmount":100.99}]',
        CONSECUTIVE_SENTENCES:
          '[{"bookingId":1202003,"sentenceSequence":1,"lineSequence":1,"caseSequence":1,"courtDescription":"Abergavenny Magistrates Court","sentenceStatus":"A","sentenceCategory":"2003","sentenceCalculationType":"ADIMP","sentenceTypeDescription":"CJA03 Standard Determinate Sentence","sentenceDate":"2022-03-10","terms":[{"years":0,"months":3,"weeks":0,"days":0,"code":"IMP"}],"offences":[{"offenderChargeId":3932803,"offenceStartDate":"2012-02-10","offenceCode":"TH68010A","offenceDescription":"Attempt theft from shop","indicators":["D","50"]}]},{"bookingId":1202003,"sentenceSequence":2,"consecutiveToSequence":1,"lineSequence":2,"caseSequence":1,"courtDescription":"Abergavenny Magistrates Court","sentenceStatus":"A","sentenceCategory":"2003","sentenceCalculationType":"ADIMP","sentenceTypeDescription":"CJA03 Standard Determinate Sentence","sentenceDate":"2022-03-10","terms":[{"years":0,"months":3,"weeks":0,"days":0,"code":"IMP"}],"offences":[{"offenderChargeId":3932805,"offenceStartDate":"2012-02-10","offenceCode":"AW06049","offenceDescription":"Administer a poisonous / injurious drug / substance to a protected animal","indicators":["113","99"]}]},{"bookingId":1202003,"sentenceSequence":3,"consecutiveToSequence":2,"lineSequence":3,"caseSequence":1,"courtDescription":"Abergavenny Magistrates Court","sentenceStatus":"A","sentenceCategory":"2003","sentenceCalculationType":"ADIMP_ORA","sentenceTypeDescription":"ORA CJA03 Standard Determinate Sentence","sentenceDate":"2022-03-10","terms":[{"years":0,"months":2,"weeks":0,"days":0,"code":"IMP"}],"offences":[{"offenderChargeId":3932804,"offenceStartDate":"2022-02-10","offenceCode":"SX03200","offenceDescription":"Adult abuse position of trust - cause child 13 - 17 watch a sexual act cared for in s.21 premises - SOA 2003","indicators":["ERS","S","24","S15/CJIB","PIMMS3","S1","M","V","H","PIMMS1","SOR"]}]},{"bookingId":1202003,"sentenceSequence":4,"consecutiveToSequence":3,"lineSequence":4,"caseSequence":1,"courtDescription":"Abergavenny Magistrates Court","sentenceStatus":"A","sentenceCategory":"2020","sentenceCalculationType":"ADIMP_ORA","sentenceTypeDescription":"ORA Sentencing Code Standard Determinate Sentence","sentenceDate":"2022-03-10","terms":[{"years":0,"months":2,"weeks":0,"days":0,"code":"IMP"}],"offences":[{"offenderChargeId":3932806,"offenceStartDate":"2022-02-10","offenceCode":"RC86374","offenceDescription":"Additional braking device insecure","indicators":["101"]}]}]',

        DPRRD: 'Server error',
        ETD: 'Server error',
        LTD: 'Server error',
        MTD: 'Server error',
        NPD: 'Server error',
        PED: 'Server error',
        PRRD: 'Server error',
        TUSED: 'Server error',
        ARD: 'Server error',
        ERROR_JSON: '{"status":500,"message":"There was an unexpected error"}',
        ERROR_TEXT: 'There was an unexpected error',
      } as OneThousandCalculationsRow

      expect(rows[0]).toStrictEqual(expected)
    })
    it('Test that a prison-api error will return a CSV row', async () => {
      prisonerService.getPrisonerDetailIncludingReleased.mockRejectedValue({
        status: 500,
        message: 'There was an unexpected error',
      })

      const rows = await oneThousandCalculationsService.runCalculations('', [], '', ['ABCDEFG'])

      const expected = {
        NOMS_ID: 'ABCDEFG',
        DOB: undefined,
        REQUEST_ID: undefined,
        CALCULATED_DATES: undefined,
        CRD: 'Prison API Error',
        NOMIS_CRD: undefined,
        NOMIS_CRD_OVERRIDE: undefined,
        CRD_MATCH: '',
        LED: 'Prison API Error',
        NOMIS_LED: undefined,
        NOMIS_LED_CALCULATED: undefined,
        NOMIS_LED_OVERRIDE: undefined,
        LED_MATCH: '',
        SED: 'Prison API Error',
        NOMIS_SED: undefined,
        NOMIS_SED_CALCULATED: undefined,
        NOMIS_SED_OVERRIDE: undefined,
        SED_MATCH: '',
        NOMIS_NPD: undefined,
        NOMIS_NPD_OVERRIDE: undefined,
        NPD_MATCH: '',
        NOMIS_ARD: undefined,
        NOMIS_ARD_OVERRIDE: undefined,
        ARD_MATCH: '',
        NOMIS_TUSED: undefined,
        NOMIS_TUSED_CALCULATED: undefined,
        NOMIS_TUSED_OVERRIDE: undefined,
        TUSED_MATCH: '',
        NOMIS_PED: undefined,
        NOMIS_PED_CALCULATED: undefined,
        NOMIS_PED_OVERRIDE: undefined,
        PED_MATCH: '',
        HDCED: 'Prison API Error',
        NOMIS_HDCED: undefined,
        NOMIS_HDCED_CALCULATED: undefined,
        NOMIS_HDCED_OVERRIDE: undefined,
        HDCED_MATCH: '',
        NOMIS_ETD: undefined,
        NOMIS_MTD: undefined,
        NOMIS_LTD: undefined,
        NOMIS_DPRRD: undefined,
        NOMIS_DPRRD_OVERRIDE: undefined,
        NOMIS_PRRD: undefined,
        NOMIS_PRRD_OVERRIDE: undefined,
        PRRD_MATCH: '',
        ESED: 'Prison API Error',
        NOMIS_ROTL: undefined,
        NOMIS_ESED: undefined,
        SENTENCE_LENGTH: '',
        ERSED: 'Prison API Error',
        NOMIS_ERSED: undefined,
        ERSED_MATCH: '',
        NOMIS_ESL: undefined,
        NOMIS_JSL: undefined,
        IS_ESL_SAME: 'N',
        IS_JSL_SAME: 'N',
        IS_PED_ADJUSTED_TO_CRD: '',
        IS_HDCED_14_DAY_RULE: '',
        HAS_SDS_PLUS_PCSC: '',
        SEX_OFFENDER: 'N',
        LOCATION: undefined,
        SENTENCES: undefined,
        ADJUSTMENTS: undefined,
        RETURN_TO_CUSTODY: undefined,
        FINE_PAYMENTS: undefined,
        REASON_CODE: undefined,
        COMMENT: undefined,
        CONSECUTIVE_SENTENCES: '',
        DPRRD: 'Prison API Error',
        ETD: 'Prison API Error',
        LTD: 'Prison API Error',
        MTD: 'Prison API Error',
        NPD: 'Prison API Error',
        PED: 'Prison API Error',
        PRRD: 'Prison API Error',
        TUSED: 'Prison API Error',
        ARD: 'Prison API Error',
        ERROR_JSON: '{"status":500,"message":"There was an unexpected error"}',
        ERROR_TEXT: 'There was an unexpected error',
      } as OneThousandCalculationsRow

      expect(rows[0]).toStrictEqual(expected)
    })
  })
})

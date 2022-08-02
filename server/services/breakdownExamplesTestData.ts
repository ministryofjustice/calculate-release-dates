import {
  BookingCalculation,
  CalculationBreakdown,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

export function psiExample16CalculationBreakdown(): CalculationBreakdown {
  return {
    concurrentSentences: [
      {
        sentencedAt: '2015-02-12',
        sentenceLength: '6 months',
        sentenceLengthDays: 181,
        dates: {
          SLED: { unadjusted: '2015-08-11', adjusted: '2015-07-28', daysFromSentenceStart: 181, adjustedByDays: 14 },
          CRD: { unadjusted: '2015-05-13', adjusted: '2015-04-29', daysFromSentenceStart: 91, adjustedByDays: 14 },
        },
        lineSequence: 1,
        caseSequence: 1,
      },
      {
        sentencedAt: '2015-02-12',
        sentenceLength: '8 months',
        sentenceLengthDays: 242,
        dates: {
          SED: { unadjusted: '2015-10-11', adjusted: '2015-09-27', daysFromSentenceStart: 242, adjustedByDays: 14 },
          ARD: { unadjusted: '2015-06-12', adjusted: '2015-05-29', daysFromSentenceStart: 121, adjustedByDays: 14 },
        },
        lineSequence: 2,
        caseSequence: 1,
      },
    ],
    consecutiveSentence: null,
    breakdownByReleaseDateType: {
      SED: {
        rules: [],
        rulesWithExtraAdjustments: {},
        adjustedDays: -14,
        releaseDate: '2015-09-27',
        unadjustedDate: '2015-10-11',
      },
      CRD: {
        rules: [],
        rulesWithExtraAdjustments: {},
        adjustedDays: -14,
        releaseDate: '2015-05-29',
        unadjustedDate: '2015-06-12',
      },
      TUSED: {
        rules: ['TUSED_LICENCE_PERIOD_LT_1Y'],
        rulesWithExtraAdjustments: { TUSED_LICENCE_PERIOD_LT_1Y: { adjustmentValue: 12, type: 'Months' } },
        adjustedDays: -21,
        releaseDate: '2016-05-26',
        unadjustedDate: '2015-06-16',
      },
      HDCED: {
        rules: ['HDCED_GE_12W_LT_18M'],
        rulesWithExtraAdjustments: { HDCED_GE_12W_LT_18M: { adjustmentValue: 61, type: 'Days' } },
        adjustedDays: -21,
        releaseDate: '2015-03-28',
        unadjustedDate: '2015-02-16',
      },
      LED: {
        rules: [],
        rulesWithExtraAdjustments: {},
        adjustedDays: -14,
        releaseDate: '2015-07-28',
        unadjustedDate: '2015-08-11',
      },
    },
    otherDates: {},
  }
}

export function psiExample25CalculationBreakdown(): CalculationBreakdown {
  return {
    concurrentSentences: [],
    consecutiveSentence: {
      sentencedAt: '2015-02-22',
      sentenceLength: '10 months',
      sentenceLengthDays: 303,
      dates: {
        SED: { unadjusted: '2015-12-21', adjusted: '2015-12-21', daysFromSentenceStart: 303, adjustedByDays: 0 },
        CRD: { unadjusted: '2015-07-23', adjusted: '2015-07-23', daysFromSentenceStart: 152, adjustedByDays: 0 },
      },
      sentenceParts: [
        {
          lineSequence: 1,
          caseSequence: 1,
          sentenceLength: '3 months',
          sentenceLengthDays: 89,
          consecutiveToLineSequence: null,
          consecutiveToCaseSequence: null,
        },
        {
          lineSequence: 2,
          caseSequence: 1,
          sentenceLength: '7 months',
          sentenceLengthDays: 212,
          consecutiveToLineSequence: 1,
          consecutiveToCaseSequence: 1,
        },
      ],
    },
    breakdownByReleaseDateType: {
      CRD: {
        rules: [],
        rulesWithExtraAdjustments: {},
        adjustedDays: 0,
        releaseDate: '2015-07-23',
        unadjustedDate: '2015-07-23',
      },
      SED: {
        rules: [],
        rulesWithExtraAdjustments: {},
        adjustedDays: 0,
        releaseDate: '2015-12-21',
        unadjustedDate: '2015-12-21',
      },
      TUSED: {
        rules: ['TUSED_LICENCE_PERIOD_LT_1Y'],
        rulesWithExtraAdjustments: { TUSED_LICENCE_PERIOD_LT_1Y: { adjustmentValue: 12, type: 'Months' } },
        adjustedDays: -21,
        releaseDate: '2016-05-26',
        unadjustedDate: '2015-06-16',
      },
      HDCED: {
        rules: ['HDCED_GE_12W_LT_18M'],
        rulesWithExtraAdjustments: { HDCED_GE_12W_LT_18M: { adjustmentValue: 61, type: 'Days' } },
        adjustedDays: -21,
        releaseDate: '2015-03-28',
        unadjustedDate: '2015-02-16',
      },
      LED: {
        rules: ['LED_CONSEC_ORA_AND_NON_ORA'],
        rulesWithExtraAdjustments: {},
        adjustedDays: 44,
        releaseDate: '2015-08-27',
        unadjustedDate: '2015-07-14',
      },
    },
    otherDates: {},
  }
}

export function pedAdjustedByCrdAndBeforePrrdReleaseDates(): BookingCalculation {
  return {
    dates: { SLED: '2029-09-14', CRD: '2026-09-14', PED: '2024-10-12', ESED: '2029-09-14' },
    calculationRequestId: 1,
    bookingId: 1,
    prisonerId: 'A1234AA',
    calculationStatus: 'PRELIMINARY',
    calculationFragments: null,
    effectiveSentenceLength: null,
  }
}

export function pedAdjustedByCrdAndBeforePrrdBreakdown(): CalculationBreakdown {
  return {
    concurrentSentences: [
      {
        sentencedAt: '2015-07-20',
        sentenceLength: '10 years',
        sentenceLengthDays: 3653,
        dates: {
          SLED: {
            unadjusted: '2025-07-19',
            adjusted: '2025-03-18',
            daysFromSentenceStart: 3653,
            adjustedByDays: 123,
          },
          PRRD: {
            unadjusted: '2020-07-19',
            adjusted: '2020-03-18',
            daysFromSentenceStart: 1827,
            adjustedByDays: 123,
          },
        },
        lineSequence: 1,
        caseSequence: 1,
        caseReference: null,
      },
      {
        sentencedAt: '2021-10-13',
        sentenceLength: '6 years',
        sentenceLengthDays: 2191,
        dates: {
          SLED: { unadjusted: '2027-10-12', adjusted: '2027-10-12', daysFromSentenceStart: 2191, adjustedByDays: 0 },
          CRD: { unadjusted: '2024-10-12', adjusted: '2024-10-12', daysFromSentenceStart: 1096, adjustedByDays: 0 },
        },
        lineSequence: 3,
        caseSequence: 3,
        caseReference: null,
      },
    ],
    consecutiveSentence: null,
    breakdownByReleaseDateType: {
      SLED: {
        rules: [],
        rulesWithExtraAdjustments: {},
        adjustedDays: 0,
        releaseDate: '2029-09-14',
        unadjustedDate: '2029-09-14',
      },
      CRD: {
        rules: [],
        rulesWithExtraAdjustments: {},
        adjustedDays: 0,
        releaseDate: '2026-09-14',
        unadjustedDate: '2026-09-14',
      },
      PED: {
        rules: ['PED_EQUAL_TO_LATEST_SDS_RELEASE'],
        rulesWithExtraAdjustments: {},
        adjustedDays: 0,
        releaseDate: '2024-10-12',
        unadjustedDate: '2024-09-14',
      },
    },
    otherDates: { PRRD: '2025-03-18' },
  }
}

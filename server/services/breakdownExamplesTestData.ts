import { CalculationBreakdown } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

export function psiExample25CalculationBreakdown(): CalculationBreakdown {
  return {
    showSds40Hints: false,
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
          externalSentenceId: {
            sentenceSequence: 0,
            bookingId: 0,
          },
        },
        {
          lineSequence: 2,
          caseSequence: 1,
          sentenceLength: '7 months',
          sentenceLengthDays: 212,
          consecutiveToLineSequence: 1,
          consecutiveToCaseSequence: 1,
          externalSentenceId: {
            sentenceSequence: 0,
            bookingId: 0,
          },
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
        rules: ['HDCED_GE_MIN_PERIOD_LT_MIDPOINT'],
        rulesWithExtraAdjustments: { HDCED_GE_MIN_PERIOD_LT_MIDPOINT: { adjustmentValue: 61, type: 'Days' } },
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
    ersedNotApplicableDueToDtoLaterThanCrd: false,
  }
}

export function pedAdjustedByCrdAndBeforePrrdBreakdown(): CalculationBreakdown {
  return {
    showSds40Hints: false,
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
        externalSentenceId: {
          sentenceSequence: 0,
          bookingId: 0,
        },
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
        externalSentenceId: {
          sentenceSequence: 0,
          bookingId: 0,
        },
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
        rules: ['PED_EQUAL_TO_LATEST_NON_PED_CONDITIONAL_RELEASE'],
        rulesWithExtraAdjustments: {},
        adjustedDays: 0,
        releaseDate: '2024-10-12',
        unadjustedDate: '2024-09-14',
      },
      HDCED: {
        rules: ['HDCED_MINIMUM_CUSTODIAL_PERIOD'],
        rulesWithExtraAdjustments: {},
        adjustedDays: 0,
        releaseDate: '2024-10-12',
        unadjustedDate: '2024-09-14',
      },
    },
    otherDates: { PRRD: '2025-03-18' },
    ersedNotApplicableDueToDtoLaterThanCrd: false,
  }
}

import { CalculationBreakdown } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

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

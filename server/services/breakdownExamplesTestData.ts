import {
  BookingCalculation,
  CalculationBreakdown,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

export function breakdownAndEffectiveDateMismatchCalc(): BookingCalculation {
  return {
    dates: { SLED: '2015-09-27', CRD: '2015-05-29' },
    calculationRequestId: 920,
  }
}

export function breakdownAndEffectiveDateMismatchBreakdown(): CalculationBreakdown {
  return {
    concurrentSentences: [
      {
        sentencedAt: '2015-02-12',
        sentenceLength: '6 months',
        sentenceLengthDays: 181,
        dates: {
          SLED: { unadjusted: '2000-08-11', adjusted: '2000-07-28', daysFromSentenceStart: 181, adjustedByDays: 14 },
          CRD: { unadjusted: '2000-05-13', adjusted: '2000-04-29', daysFromSentenceStart: 91, adjustedByDays: 14 },
        },
        lineSequence: 1,
        caseSequence: 1,
      },
    ],
    consecutiveSentence: null,
  }
}
export function psiExample16CalculationResults(): BookingCalculation {
  return {
    dates: { SED: '2015-09-27', LED: '2015-07-28', CRD: '2015-05-29', HDCED: '2015-03-31', ESED: '2015-10-11' },
    calculationRequestId: 920,
  }
}

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
  }
}

export function psiExample25CalculationResults(): BookingCalculation {
  return {
    dates: {
      SED: '2015-12-21',
      CRD: '2015-07-23',
      LED: '2015-09-05',
      TUSED: '2016-07-23',
      HDCED: '2015-05-09',
      ESED: '2015-12-21',
    },
    calculationRequestId: 923,
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
  }
}

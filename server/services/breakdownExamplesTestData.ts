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
        rules: ['HDCED_GE_MIN_PERIOD_LT_MIDPOINT'],
        rulesWithExtraAdjustments: { HDCED_GE_MIN_PERIOD_LT_MIDPOINT: { adjustmentValue: 61, type: 'Days' } },
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
  }
}

export function pedAdjustedByCrdAndBeforePrrdReleaseDates(): BookingCalculation {
  return {
    dates: { SLED: '2029-09-14', CRD: '2026-09-14', PED: '2024-10-12', ESED: '2029-09-14' },
    calculationRequestId: 1,
    bookingId: 1,
    prisonerId: 'A1234AA',
    calculationStatus: 'PRELIMINARY',
    calculationReference: 'ABC123',
    calculationType: 'CALCULATED',
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
  }
}

export function hdcedAdjustedToArd(): CalculationBreakdown {
  return {
    concurrentSentences: [
      {
        sentencedAt: '2022-03-21',
        sentenceLength: '18 months',
        sentenceLengthDays: 549,
        dates: {
          SLED: {
            unadjusted: '2023-09-20',
            adjusted: '2023-09-20',
            daysFromSentenceStart: 549,
            adjustedByDays: 0,
          },
          CRD: {
            unadjusted: '2022-12-20',
            adjusted: '2022-12-20',
            daysFromSentenceStart: 275,
            adjustedByDays: 0,
          },
        },
        lineSequence: 0,
        caseSequence: 0,
        caseReference: null,
      },
      {
        sentencedAt: '2022-07-11',
        sentenceLength: '70 days',
        sentenceLengthDays: 70,
        dates: {
          SED: {
            unadjusted: '2022-09-18',
            adjusted: '2022-09-18',
            daysFromSentenceStart: 70,
            adjustedByDays: 0,
          },
          ARD: {
            unadjusted: '2022-08-14',
            adjusted: '2022-08-14',
            daysFromSentenceStart: 35,
            adjustedByDays: 0,
          },
        },
        lineSequence: 0,
        caseSequence: 0,
        caseReference: null,
      },
    ],
    consecutiveSentence: null,
    breakdownByReleaseDateType: {
      SLED: {
        rules: [],
        rulesWithExtraAdjustments: {},
        adjustedDays: 0,
        releaseDate: '2023-09-20',
        unadjustedDate: '2023-09-20',
      },
      CRD: {
        rules: [],
        rulesWithExtraAdjustments: {},
        adjustedDays: 0,
        releaseDate: '2022-12-20',
        unadjustedDate: '2022-12-20',
      },
      HDCED: {
        rules: ['HDCED_ADJUSTED_TO_CONCURRENT_ACTUAL_RELEASE'],
        rulesWithExtraAdjustments: {},
        adjustedDays: -6,
        releaseDate: '2022-08-14',
        unadjustedDate: '2022-08-08',
      },
    },
    otherDates: {},
  }
}

export function hdcedAdjustedToArdReleaseDates(): BookingCalculation {
  return {
    dates: {
      SLED: '2023-09-20',
      CRD: '2022-12-20',
      TUSED: '2023-12-20',
      HDCED: '2022-08-14',
      ESED: '2023-09-20',
    },
    calculationRequestId: 1,
    calculationReference: 'ABC123',
    bookingId: 1,
    prisonerId: 'A1234AA',
    calculationStatus: 'PRELIMINARY',
    calculationType: 'CALCULATED',
    calculationFragments: null,
    effectiveSentenceLength: null,
  }
}

export function mtdLaterThanCrd(): BookingCalculation {
  return {
    dates: {
      SLED: '2023-09-20',
      CRD: '2022-12-20',
      MTD: '2023-12-20',
      HDCED: '2022-08-14',
      ESED: '2023-09-20',
    },
    calculationRequestId: 1,
    calculationReference: 'ABC123',
    bookingId: 1,
    prisonerId: 'A1234AA',
    calculationStatus: 'PRELIMINARY',
    calculationType: 'CALCULATED',
    calculationFragments: null,
    effectiveSentenceLength: null,
  }
}

export function mtdLaterThanArd(): BookingCalculation {
  return {
    dates: {
      SLED: '2023-09-20',
      ARD: '2022-12-20',
      MTD: '2023-12-20',
      HDCED: '2022-08-14',
      ESED: '2023-09-20',
    },
    calculationRequestId: 1,
    calculationReference: 'ABC123',
    bookingId: 1,
    prisonerId: 'A1234AA',
    calculationStatus: 'PRELIMINARY',
    calculationType: 'CALCULATED',
    calculationFragments: null,
    effectiveSentenceLength: null,
  }
}

export function mtdLaterThanPed(): BookingCalculation {
  return {
    dates: {
      SLED: '2023-09-20',
      PED: '2022-12-20',
      MTD: '2023-12-20',
      HDCED: '2022-08-14',
      ESED: '2023-09-20',
    },
    calculationRequestId: 1,
    calculationReference: 'ABC123',
    bookingId: 1,
    prisonerId: 'A1234AA',
    calculationStatus: 'PRELIMINARY',
    calculationType: 'CALCULATED',
    calculationFragments: null,
    effectiveSentenceLength: null,
  }
}

export function mtdLaterThanHdcedWithCrd(): BookingCalculation {
  return {
    dates: {
      SLED: '2023-09-20',
      CRD: '2024-12-20',
      MTD: '2023-12-20',
      HDCED: '2022-08-14',
      ESED: '2023-09-20',
    },
    calculationRequestId: 1,
    calculationReference: 'ABC123',
    bookingId: 1,
    prisonerId: 'A1234AA',
    calculationStatus: 'PRELIMINARY',
    calculationType: 'CALCULATED',
    calculationFragments: null,
    effectiveSentenceLength: null,
  }
}

export function mtdLaterThanHdcedWithArd(): BookingCalculation {
  return {
    dates: {
      SLED: '2023-09-20',
      ARD: '2024-12-20',
      MTD: '2023-12-20',
      HDCED: '2022-08-14',
      ESED: '2023-09-20',
    },
    calculationRequestId: 1,
    calculationReference: 'ABC123',
    bookingId: 1,
    prisonerId: 'A1234AA',
    calculationStatus: 'PRELIMINARY',
    calculationType: 'CALCULATED',
    calculationFragments: null,
    effectiveSentenceLength: null,
  }
}

export function mtdBeforeHdcedAndCrd(): BookingCalculation {
  return {
    dates: {
      SLED: '2023-09-20',
      CRD: '2024-12-20',
      MTD: '2021-12-20',
      HDCED: '2022-08-14',
      ESED: '2023-09-20',
    },
    calculationRequestId: 1,
    calculationReference: 'ABC123',
    bookingId: 1,
    prisonerId: 'A1234AA',
    calculationStatus: 'PRELIMINARY',
    calculationType: 'CALCULATED',
    calculationFragments: null,
    effectiveSentenceLength: null,
  }
}

export function mtdBeforePedAndCrd(): BookingCalculation {
  return {
    dates: {
      SLED: '2023-09-20',
      CRD: '2024-12-20',
      MTD: '2021-12-20',
      PED: '2022-08-14',
      ESED: '2023-09-20',
    },
    calculationRequestId: 1,
    calculationReference: 'ABC123',
    bookingId: 1,
    prisonerId: 'A1234AA',
    calculationStatus: 'PRELIMINARY',
    calculationType: 'CALCULATED',
    calculationFragments: null,
    effectiveSentenceLength: null,
  }
}

export function ersedBeforeMtdBeforeCrd(): BookingCalculation {
  return {
    dates: {
      SLED: '2023-09-20',
      CRD: '2024-12-20',
      ERSED: '2021-12-20',
      MTD: '2022-08-14',
      ESED: '2023-09-20',
    },
    calculationReference: 'ABC123',
    calculationRequestId: 1,
    bookingId: 1,
    prisonerId: 'A1234AA',
    calculationStatus: 'PRELIMINARY',
    calculationType: 'CALCULATED',
    calculationFragments: null,
    effectiveSentenceLength: null,
  }
}

export function ersedBeforeCrdBeforeMtd(): BookingCalculation {
  return {
    dates: {
      SLED: '2023-09-20',
      MTD: '2024-12-20',
      ERSED: '2021-12-20',
      CRD: '2022-08-14',
      ESED: '2023-09-20',
    },
    calculationReference: 'ABC123',
    calculationRequestId: 1,
    bookingId: 1,
    prisonerId: 'A1234AA',
    calculationStatus: 'PRELIMINARY',
    calculationType: 'CALCULATED',
    calculationFragments: null,
    effectiveSentenceLength: null,
  }
}

export function ersedAdjustedByArdReleaseDate(): BookingCalculation {
  return {
    dates: {
      SLED: '2023-07-25',
      CRD: '2022-01-24',
      HDCED: '2021-09-12',
      ERSED: '2021-05-02',
      ESED: '2023-07-25',
    },
    calculationRequestId: 1,
    calculationReference: 'ABC123',
    bookingId: 1,
    prisonerId: 'A1234AA',
    calculationStatus: 'PRELIMINARY',
    calculationType: 'CALCULATED',
    calculationFragments: null,
    effectiveSentenceLength: null,
  }
}

export function ersedHalfwayBreakdown(): CalculationBreakdown {
  return {
    concurrentSentences: [],
    consecutiveSentence: null,
    breakdownByReleaseDateType: {
      ERSED: {
        rules: ['ERSED_MIN_EFFECTIVE_DATE'],
        rulesWithExtraAdjustments: {},
        adjustedDays: 50,
        releaseDate: '2010-12-01',
        unadjustedDate: '2010-12-01',
      },
    },
    otherDates: {},
  }
}
export function ersedTwoThirdsBreakdown(): CalculationBreakdown {
  return {
    concurrentSentences: [],
    consecutiveSentence: null,
    breakdownByReleaseDateType: {
      ERSED: {
        rules: ['ERSED_MIN_EFFECTIVE_DATE'],
        rulesWithExtraAdjustments: {},
        adjustedDays: 66,
        releaseDate: '2023-03-20',
        unadjustedDate: '2023-03-20',
      },
    },
    otherDates: {},
  }
}
export function ersedAdjustedByArdBreakdown(): CalculationBreakdown {
  return {
    concurrentSentences: [],
    consecutiveSentence: null,
    breakdownByReleaseDateType: {
      ERSED: {
        rules: ['ERSED_ADJUSTED_TO_CONCURRENT_TERM'],
        rulesWithExtraAdjustments: {},
        adjustedDays: 0,
        releaseDate: '2021-05-02',
        unadjustedDate: '2021-04-26',
      },
    },
    otherDates: {},
  }
}
export function ersedBeforeSentenceBreakdown(): CalculationBreakdown {
  return {
    concurrentSentences: [],
    consecutiveSentence: null,
    breakdownByReleaseDateType: {
      ERSED: {
        rules: ['ERSED_BEFORE_SENTENCE_DATE'],
        rulesWithExtraAdjustments: {},
        adjustedDays: 0,
        releaseDate: '2022-08-26',
        unadjustedDate: '2023-01-13',
      },
    },
    otherDates: {},
  }
}

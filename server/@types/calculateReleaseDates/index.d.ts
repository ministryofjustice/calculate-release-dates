/* eslint-disable camelcase */
/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
  '/test/calculation-by-booking': {
    /** This endpoint will calculate release dates based on a prisoners booking data (e.g. sentences and adjustments) */
    post: operations['calculate']
  }
  '/calculation/{prisonerId}': {
    /** This endpoint will calculate release dates based on a prisoners latest booking - this is a PRELIMINARY calculation that will not be published to NOMIS */
    post: operations['calculate_1']
  }
  '/calculation/{prisonerId}/validate': {
    /** This endpoint will validate that the data for the given prisoner in NOMIS can be supported by the calculate release dates engine */
    post: operations['validate']
  }
  '/calculation/{prisonerId}/confirm/{calculationRequestId}': {
    /** This endpoint will calculate release dates based on a prisoners latest booking */
    post: operations['confirmCalculation']
  }
  '/working-day/previous/{date}': {
    /** Finds the previous working day, adjusting for weekends and bank holidays */
    get: operations['previousWorkingDay']
  }
  '/working-day/next/{date}': {
    /** Finds the next working day, adjusting for weekends and bank holidays */
    get: operations['nextWorkingDay']
  }
  '/calculation/{prisonerId}/user-questions': {
    /** This endpoint will return which sentences and offences may be considered for different calculation rules.We will have to ask the user for clarification if any of the rules apply beacuse we cannot trust input data from NOMIS */
    get: operations['getCalculationUserQuestions']
  }
  '/calculation/sentence-and-offences/{calculationRequestId}': {
    /** This endpoint will return the sentences and offences based on a calculationRequestId */
    get: operations['getSentencesAndOffence']
  }
  '/calculation/return-to-custody/{calculationRequestId}': {
    /** This endpoint will return the return to custody date based on a calculationRequestId */
    get: operations['getReturnToCustodyDate']
  }
  '/calculation/results/{prisonerId}/{bookingId}': {
    /** This endpoint will return the confirmed release dates based on a prisoners booking */
    get: operations['getConfirmedCalculationResults']
  }
  '/calculation/results/{calculationRequestId}': {
    /** This endpoint will return the release dates based on a calculationRequestId */
    get: operations['getCalculationResults']
  }
  '/calculation/prisoner-details/{calculationRequestId}': {
    /** This endpoint will return the prisoner details based on a calculationRequestId */
    get: operations['getPrisonerDetails']
  }
  '/calculation/diagram/{calculationRequestId}': {
    /** This endpoint will return the data required for a sentence diagram for the given calculationRequestId */
    get: operations['getSentenceDiagram']
  }
  '/calculation/calculation-user-input/{calculationRequestId}': {
    /** This endpoint will return the user input based on a calculationRequestId */
    get: operations['getCalculationInput']
  }
  '/calculation/breakdown/{calculationRequestId}': {
    /** This endpoint will return the breakdown based on a calculationRequestId */
    get: operations['getCalculationBreakdown']
  }
  '/calculation/adjustments/{calculationRequestId}': {
    /** This endpoint will return the adjustments based on a calculationRequestId */
    get: operations['get']
  }
}

export interface components {
  schemas: {
    AbstractSentence: {
      offence: components['schemas']['Offence']
      /** Format: date */
      sentencedAt: string
      /** Format: uuid */
      identifier: string
      consecutiveSentenceUUIDs: string[]
      /** Format: int32 */
      caseSequence?: number
      /** Format: int32 */
      lineSequence?: number
      caseReference?: string
      recallType?: 'STANDARD_RECALL' | 'FIXED_TERM_RECALL_14' | 'FIXED_TERM_RECALL_28'
      type: string
    }
    Adjustment: {
      /** Format: date */
      appliesToSentencesFrom: string
      /** Format: int32 */
      numberOfDays: number
      /** Format: date */
      fromDate?: string
      /** Format: date */
      toDate?: string
    }
    Adjustments: {
      adjustments?: { [key: string]: components['schemas']['Adjustment'][] }
    }
    Booking: {
      offender: components['schemas']['Offender']
      sentences: (
        | components['schemas']['ExtendedDeterminateSentence']
        | components['schemas']['SopcSentence']
        | components['schemas']['StandardDeterminateSentence']
      )[]
      adjustments: components['schemas']['Adjustments']
      /** Format: date */
      returnToCustodyDate?: string
      /** Format: int64 */
      bookingId: number
    }
    Duration: {
      durationElements: { [key: string]: number }
    }
    ExtendedDeterminateSentence: components['schemas']['AbstractSentence'] & {
      custodialDuration?: components['schemas']['Duration']
      extensionDuration?: components['schemas']['Duration']
      automaticRelease?: boolean
    } & {
      automaticRelease: unknown
      consecutiveSentenceUUIDs: unknown
      custodialDuration: unknown
      extensionDuration: unknown
      identifier: unknown
      offence: unknown
      sentencedAt: unknown
    }
    Offence: {
      /** Format: date */
      committedAt: string
      isScheduleFifteen: boolean
      isScheduleFifteenMaximumLife: boolean
      isPcscSds: boolean
      isPcscSec250: boolean
      isPcscSdsPlus: boolean
    }
    Offender: {
      reference: string
      /** Format: date */
      dateOfBirth: string
      isActiveSexOffender: boolean
    }
    SopcSentence: components['schemas']['AbstractSentence'] & {
      custodialDuration?: components['schemas']['Duration']
      extensionDuration?: components['schemas']['Duration']
      sdopcu18?: boolean
    } & {
      consecutiveSentenceUUIDs: unknown
      custodialDuration: unknown
      extensionDuration: unknown
      identifier: unknown
      offence: unknown
      sdopcu18: unknown
      sentencedAt: unknown
    }
    StandardDeterminateSentence: components['schemas']['AbstractSentence'] & {
      duration?: components['schemas']['Duration']
      section250?: boolean
    } & {
      consecutiveSentenceUUIDs: unknown
      duration: unknown
      identifier: unknown
      offence: unknown
      section250: unknown
      sentencedAt: unknown
    }
    CalculatedReleaseDates: {
      dates: { [key: string]: string }
      /** Format: int64 */
      calculationRequestId: number
      /** Format: int64 */
      bookingId: number
      prisonerId: string
      calculationStatus: 'PRELIMINARY' | 'CONFIRMED' | 'ERROR'
      calculationFragments?: components['schemas']['CalculationFragments']
      effectiveSentenceLength?: {
        /** Format: int32 */
        years?: number
        /** Format: int32 */
        months?: number
        /** Format: int32 */
        days?: number
        zero?: boolean
        negative?: boolean
        units?: {
          durationEstimated?: boolean
          duration?: {
            /** Format: int64 */
            seconds?: number
            zero?: boolean
            /** Format: int32 */
            nano?: number
            negative?: boolean
            positive?: boolean
          }
          timeBased?: boolean
          dateBased?: boolean
        }[]
        chronology?: {
          id?: string
          calendarType?: string
        }
      }
    }
    CalculationFragments: {
      breakdownHtml: string
    }
    CalculationSentenceUserInput: {
      /** Format: int32 */
      sentenceSequence: number
      offenceCode: string
      userInputType: 'ORIGINAL' | 'FOUR_TO_UNDER_SEVEN' | 'SECTION_250' | 'UPDATED'
      userChoice: boolean
    }
    CalculationUserInputs: {
      sentenceCalculationUserInputs: components['schemas']['CalculationSentenceUserInput'][]
    }
    ValidationMessage: {
      message: string
      code:
        | 'UNSUPPORTED_SENTENCE_TYPE'
        | 'OFFENCE_DATE_AFTER_SENTENCE_START_DATE'
        | 'OFFENCE_DATE_AFTER_SENTENCE_RANGE_DATE'
        | 'OFFENCE_MISSING_DATE'
        | 'REMAND_FROM_TO_DATES_REQUIRED'
        | 'SENTENCE_HAS_MULTIPLE_TERMS'
        | 'REMAND_OVERLAPS_WITH_REMAND'
        | 'REMAND_OVERLAPS_WITH_SENTENCE'
        | 'CUSTODIAL_PERIOD_EXTINGUISHED'
        | 'ADJUSTMENT_AFTER_RELEASE'
        | 'MULTIPLE_SENTENCES_CONSECUTIVE_TO'
        | 'PRISONER_SUBJECT_TO_PTD'
        | 'SEC_91_SENTENCE_TYPE_INCORRECT'
        | 'ADJUSTMENT_FUTURE_DATED'
        | 'SENTENCE_HAS_NO_IMPRISONMENT_TERM'
        | 'SENTENCE_HAS_NO_LICENCE_TERM'
        | 'ZERO_IMPRISONMENT_TERM'
        | 'EDS_LICENCE_TERM_LESS_THAN_ONE_YEAR'
        | 'EDS_LICENCE_TERM_MORE_THAN_EIGHT_YEARS'
        | 'EDS18_EDS21_EDSU18_SENTENCE_TYPE_INCORRECT'
        | 'LASPO_AR_SENTENCE_TYPE_INCORRECT'
        | 'MORE_THAN_ONE_IMPRISONMENT_TERM'
        | 'MORE_THAN_ONE_LICENCE_TERM'
        | 'SOPC_LICENCE_TERM_NOT_12_MONTHS'
        | 'SEC236A_SENTENCE_TYPE_INCORRECT'
        | 'SOPC18_SOPC21_SENTENCE_TYPE_INCORRECT'
        | 'A_FINE_SENTENCE_MISSING_FINE_AMOUNT'
      /** Format: int32 */
      sentenceSequence?: number
      arguments: string[]
    }
    ValidationMessages: {
      type: 'UNSUPPORTED' | 'VALIDATION' | 'VALID'
      messages: components['schemas']['ValidationMessage'][]
    }
    WorkingDay: {
      /** Format: date */
      date: string
      adjustedForWeekend: boolean
      adjustedForBankHoliday: boolean
    }
    CalculationSentenceQuestion: {
      /** Format: int32 */
      sentenceSequence: number
      userInputType: 'ORIGINAL' | 'FOUR_TO_UNDER_SEVEN' | 'SECTION_250' | 'UPDATED'
    }
    CalculationUserQuestions: {
      sentenceQuestions: components['schemas']['CalculationSentenceQuestion'][]
    }
    OffenderOffence: {
      /** Format: int64 */
      offenderChargeId: number
      /** Format: date */
      offenceStartDate?: string
      /** Format: date */
      offenceEndDate?: string
      offenceCode: string
      offenceDescription: string
      indicators: string[]
      pcscSec250: boolean
      pcscSds: boolean
      pcscSdsPlus: boolean
      scheduleFifteenMaximumLife: boolean
    }
    SentenceAndOffences: {
      /** Format: int64 */
      bookingId: number
      /** Format: int32 */
      sentenceSequence: number
      /** Format: int32 */
      lineSequence: number
      /** Format: int32 */
      caseSequence: number
      /** Format: int32 */
      consecutiveToSequence?: number
      sentenceStatus: string
      sentenceCategory: string
      sentenceCalculationType: string
      sentenceTypeDescription: string
      /** Format: date */
      sentenceDate: string
      terms: components['schemas']['SentenceTerms'][]
      offences: components['schemas']['OffenderOffence'][]
      caseReference?: string
      courtDescription?: string
    }
    SentenceTerms: {
      /** Format: int32 */
      years: number
      /** Format: int32 */
      months: number
      /** Format: int32 */
      weeks: number
      /** Format: int32 */
      days: number
      code: string
    }
    ReturnToCustodyDate: {
      /** Format: int64 */
      bookingId: number
      /** Format: date */
      returnToCustodyDate: string
    }
    Alert: {
      /** Format: date */
      dateCreated: string
      /** Format: date */
      dateExpires?: string
      alertType: string
      alertCode: string
    }
    PrisonerDetails: {
      /** Format: int64 */
      bookingId: number
      offenderNo: string
      firstName: string
      lastName: string
      /** Format: date */
      dateOfBirth: string
      alerts: components['schemas']['Alert'][]
    }
    SentenceDiagram: {
      rows: components['schemas']['SentenceDiagramRow'][]
    }
    SentenceDiagramRow: {
      description: string
      sections: components['schemas']['SentenceDiagramRowSection'][]
    }
    SentenceDiagramRowSection: {
      /** Format: date */
      start: string
      /** Format: date */
      end: string
      description?: string
    }
    /** @description Adjustments details associated that are specifically added as part of a rule */
    AdjustmentDuration: {
      /**
       * Format: int32
       * @description Amount of adjustment
       */
      adjustmentValue: number
      /**
       * @description Unit of adjustment
       * @example DAYS
       */
      type:
        | 'Nanos'
        | 'Micros'
        | 'Millis'
        | 'Seconds'
        | 'Minutes'
        | 'Hours'
        | 'HalfDays'
        | 'Days'
        | 'Weeks'
        | 'Months'
        | 'Years'
        | 'Decades'
        | 'Centuries'
        | 'Millennia'
        | 'Eras'
        | 'Forever'
    }
    /** @description Calculation breakdown details */
    CalculationBreakdown: {
      concurrentSentences: components['schemas']['ConcurrentSentenceBreakdown'][]
      consecutiveSentence?: components['schemas']['ConsecutiveSentenceBreakdown']
      /** @description Breakdown details in a map keyed by release date type */
      breakdownByReleaseDateType: {
        [key: string]: components['schemas']['ReleaseDateCalculationBreakdown']
      }
      otherDates: { [key: string]: string }
    }
    ConcurrentSentenceBreakdown: {
      /** Format: date */
      sentencedAt: string
      sentenceLength: string
      /** Format: int32 */
      sentenceLengthDays: number
      dates: { [key: string]: components['schemas']['DateBreakdown'] }
      /** Format: int32 */
      lineSequence: number
      /** Format: int32 */
      caseSequence: number
      caseReference?: string
    }
    ConsecutiveSentenceBreakdown: {
      /** Format: date */
      sentencedAt: string
      sentenceLength: string
      /** Format: int32 */
      sentenceLengthDays: number
      dates: { [key: string]: components['schemas']['DateBreakdown'] }
      sentenceParts: components['schemas']['ConsecutiveSentencePart'][]
    }
    ConsecutiveSentencePart: {
      /** Format: int32 */
      lineSequence: number
      /** Format: int32 */
      caseSequence: number
      caseReference?: string
      sentenceLength: string
      /** Format: int32 */
      sentenceLengthDays: number
      /** Format: int32 */
      consecutiveToLineSequence?: number
      /** Format: int32 */
      consecutiveToCaseSequence?: number
    }
    DateBreakdown: {
      /** Format: date */
      unadjusted: string
      /** Format: date */
      adjusted: string
      /** Format: int64 */
      daysFromSentenceStart: number
      /** Format: int64 */
      adjustedByDays: number
    }
    /** @description Calculation breakdown details for a release date type */
    ReleaseDateCalculationBreakdown: {
      /**
       * @description Calculation rules used to determine this calculation.
       * @example [HDCED_LT_18_MONTHS]
       */
      rules: (
        | 'HDCED_GE_12W_LT_18M'
        | 'HDCED_GE_18M_LT_4Y'
        | 'HDCED_MINIMUM_14D'
        | 'TUSED_LICENCE_PERIOD_LT_1Y'
        | 'LED_CONSEC_ORA_AND_NON_ORA'
        | 'UNUSED_ADA'
        | 'IMMEDIATE_RELEASE'
        | 'PED_EQUAL_TO_LATEST_NON_PED_RELEASE'
      )[]
      /** @description Adjustments details associated that are specifically added as part of a rule */
      rulesWithExtraAdjustments: {
        [key: string]: components['schemas']['AdjustmentDuration']
      }
      /**
       * Format: int32
       * @description Amount of adjustment in days
       */
      adjustedDays: number
      /**
       * Format: date
       * @description Final release date (after all adjustments have been applied)
       */
      releaseDate: string
      /**
       * Format: date
       * @description Based on the screen design, the unadjusted date isn't derived in a consistent manner but is set as per the screen design
       */
      unadjustedDate: string
    }
    BookingAdjustments: {
      active: boolean
      /** Format: date */
      fromDate: string
      /** Format: date */
      toDate?: string
      /** Format: int32 */
      numberOfDays: number
      type:
        | 'ADDITIONAL_DAYS_AWARDED'
        | 'LAWFULLY_AT_LARGE'
        | 'RESTORED_ADDITIONAL_DAYS_AWARDED'
        | 'SPECIAL_REMISSION'
        | 'UNLAWFULLY_AT_LARGE'
    }
    BookingAndSentenceAdjustments: {
      bookingAdjustments: components['schemas']['BookingAdjustments'][]
      sentenceAdjustments: components['schemas']['SentenceAdjustments'][]
    }
    SentenceAdjustments: {
      /** Format: int32 */
      sentenceSequence: number
      active: boolean
      /** Format: date */
      fromDate?: string
      /** Format: date */
      toDate?: string
      /** Format: int32 */
      numberOfDays: number
      type: 'RECALL_SENTENCE_REMAND' | 'RECALL_SENTENCE_TAGGED_BAIL' | 'REMAND' | 'TAGGED_BAIL' | 'UNUSED_REMAND'
    }
  }
}

export interface operations {
  /** This endpoint will calculate release dates based on a prisoners booking data (e.g. sentences and adjustments) */
  calculate: {
    responses: {
      /** Unauthorised, requires a valid Oauth2 token */
      401: {
        content: {
          'application/json': components['schemas']['CalculatedReleaseDates']
        }
      }
      /** Forbidden, requires an appropriate role */
      403: {
        content: {
          'application/json': components['schemas']['CalculatedReleaseDates']
        }
      }
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['Booking']
      }
    }
  }
  /** This endpoint will calculate release dates based on a prisoners latest booking - this is a PRELIMINARY calculation that will not be published to NOMIS */
  calculate_1: {
    parameters: {
      path: {
        /** The prisoners ID (aka nomsId) */
        prisonerId: string
      }
    }
    responses: {
      /** Unauthorised, requires a valid Oauth2 token */
      401: {
        content: {
          'application/json': components['schemas']['CalculatedReleaseDates']
        }
      }
      /** Forbidden, requires an appropriate role */
      403: {
        content: {
          'application/json': components['schemas']['CalculatedReleaseDates']
        }
      }
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['CalculationUserInputs']
      }
    }
  }
  /** This endpoint will validate that the data for the given prisoner in NOMIS can be supported by the calculate release dates engine */
  validate: {
    parameters: {
      path: {
        /** The prisoners ID (aka nomsId) */
        prisonerId: string
      }
    }
    responses: {
      /** Unauthorised, requires a valid Oauth2 token */
      401: {
        content: {
          'application/json': components['schemas']['ValidationMessages']
        }
      }
      /** Forbidden, requires an appropriate role */
      403: {
        content: {
          'application/json': components['schemas']['ValidationMessages']
        }
      }
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['CalculationUserInputs']
      }
    }
  }
  /** This endpoint will calculate release dates based on a prisoners latest booking */
  confirmCalculation: {
    parameters: {
      path: {
        /** The prisoners ID (aka nomsId) */
        prisonerId: string
        /** The calculation request ID of the calculation to be confirmed */
        calculationRequestId: number
      }
    }
    responses: {
      /** Unauthorised, requires a valid Oauth2 token */
      401: {
        content: {
          'application/json': components['schemas']['CalculatedReleaseDates']
        }
      }
      /** Forbidden, requires an appropriate role */
      403: {
        content: {
          'application/json': components['schemas']['CalculatedReleaseDates']
        }
      }
      /** No calculation exists for the passed calculationRequestId or the write to NOMIS has failed */
      404: {
        content: {
          'application/json': components['schemas']['CalculatedReleaseDates']
        }
      }
      /** The booking data that was used for the preliminary calculation has changed */
      412: {
        content: {
          'application/json': components['schemas']['CalculatedReleaseDates']
        }
      }
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['CalculationFragments']
      }
    }
  }
  /** Finds the previous working day, adjusting for weekends and bank holidays */
  previousWorkingDay: {
    parameters: {
      path: {
        /** The date to adjust */
        date: string
      }
    }
    responses: {
      /** Unauthorised, requires a valid Oauth2 token */
      401: {
        content: {
          'application/json': components['schemas']['WorkingDay']
        }
      }
      /** Forbidden, requires an appropriate role */
      403: {
        content: {
          'application/json': components['schemas']['WorkingDay']
        }
      }
    }
  }
  /** Finds the next working day, adjusting for weekends and bank holidays */
  nextWorkingDay: {
    parameters: {
      path: {
        /** The date to adjust */
        date: string
      }
    }
    responses: {
      /** Unauthorised, requires a valid Oauth2 token */
      401: {
        content: {
          'application/json': components['schemas']['WorkingDay']
        }
      }
      /** Forbidden, requires an appropriate role */
      403: {
        content: {
          'application/json': components['schemas']['WorkingDay']
        }
      }
    }
  }
  /** This endpoint will return which sentences and offences may be considered for different calculation rules.We will have to ask the user for clarification if any of the rules apply beacuse we cannot trust input data from NOMIS */
  getCalculationUserQuestions: {
    parameters: {
      path: {
        /** The prisoners ID (aka nomsId) */
        prisonerId: string
      }
    }
    responses: {
      /** Unauthorised, requires a valid Oauth2 token */
      401: {
        content: {
          'application/json': components['schemas']['CalculationUserQuestions']
        }
      }
      /** Forbidden, requires an appropriate role */
      403: {
        content: {
          'application/json': components['schemas']['CalculationUserQuestions']
        }
      }
    }
  }
  /** This endpoint will return the sentences and offences based on a calculationRequestId */
  getSentencesAndOffence: {
    parameters: {
      path: {
        /** The calculationRequestId of the calculation */
        calculationRequestId: number
      }
    }
    responses: {
      /** Unauthorised, requires a valid Oauth2 token */
      401: {
        content: {
          'application/json': components['schemas']['SentenceAndOffences'][]
        }
      }
      /** Forbidden, requires an appropriate role */
      403: {
        content: {
          'application/json': components['schemas']['SentenceAndOffences'][]
        }
      }
      /** No calculation exists for this calculationRequestId */
      404: {
        content: {
          'application/json': components['schemas']['SentenceAndOffences'][]
        }
      }
    }
  }
  /** This endpoint will return the return to custody date based on a calculationRequestId */
  getReturnToCustodyDate: {
    parameters: {
      path: {
        /** The calculationRequestId of the calculation */
        calculationRequestId: number
      }
    }
    responses: {
      /** Unauthorised, requires a valid Oauth2 token */
      401: {
        content: {
          'application/json': components['schemas']['ReturnToCustodyDate']
        }
      }
      /** Forbidden, requires an appropriate role */
      403: {
        content: {
          'application/json': components['schemas']['ReturnToCustodyDate']
        }
      }
      /** No calculation exists for this calculationRequestId */
      404: {
        content: {
          'application/json': components['schemas']['ReturnToCustodyDate']
        }
      }
    }
  }
  /** This endpoint will return the confirmed release dates based on a prisoners booking */
  getConfirmedCalculationResults: {
    parameters: {
      path: {
        /** The prisoners ID (aka nomsId) */
        prisonerId: string
        /** The booking ID associated with the calculation */
        bookingId: number
      }
    }
    responses: {
      /** Unauthorised, requires a valid Oauth2 token */
      401: {
        content: {
          'application/json': components['schemas']['CalculatedReleaseDates']
        }
      }
      /** Forbidden, requires an appropriate role */
      403: {
        content: {
          'application/json': components['schemas']['CalculatedReleaseDates']
        }
      }
      /** No confirmed calculation exists for this prisoner and booking */
      404: {
        content: {
          'application/json': components['schemas']['CalculatedReleaseDates']
        }
      }
    }
  }
  /** This endpoint will return the release dates based on a calculationRequestId */
  getCalculationResults: {
    parameters: {
      path: {
        /** The calculationRequestId of the results */
        calculationRequestId: number
      }
    }
    responses: {
      /** Unauthorised, requires a valid Oauth2 token */
      401: {
        content: {
          'application/json': components['schemas']['CalculatedReleaseDates']
        }
      }
      /** Forbidden, requires an appropriate role */
      403: {
        content: {
          'application/json': components['schemas']['CalculatedReleaseDates']
        }
      }
      /** No calculation exists for this calculationRequestId */
      404: {
        content: {
          'application/json': components['schemas']['CalculatedReleaseDates']
        }
      }
    }
  }
  /** This endpoint will return the prisoner details based on a calculationRequestId */
  getPrisonerDetails: {
    parameters: {
      path: {
        /** The calculationRequestId of the calculation */
        calculationRequestId: number
      }
    }
    responses: {
      /** Unauthorised, requires a valid Oauth2 token */
      401: {
        content: {
          'application/json': components['schemas']['PrisonerDetails']
        }
      }
      /** Forbidden, requires an appropriate role */
      403: {
        content: {
          'application/json': components['schemas']['PrisonerDetails']
        }
      }
      /** No calculation exists for this calculationRequestId */
      404: {
        content: {
          'application/json': components['schemas']['PrisonerDetails']
        }
      }
    }
  }
  /** This endpoint will return the data required for a sentence diagram for the given calculationRequestId */
  getSentenceDiagram: {
    parameters: {
      path: {
        /** The calculationRequestId of the diagram */
        calculationRequestId: number
      }
    }
    responses: {
      /** Unauthorised, requires a valid Oauth2 token */
      401: {
        content: {
          'application/json': components['schemas']['SentenceDiagram']
        }
      }
      /** Forbidden, requires an appropriate role */
      403: {
        content: {
          'application/json': components['schemas']['SentenceDiagram']
        }
      }
      /** No calculation exists for this calculationRequestId */
      404: {
        content: {
          'application/json': components['schemas']['SentenceDiagram']
        }
      }
    }
  }
  /** This endpoint will return the user input based on a calculationRequestId */
  getCalculationInput: {
    parameters: {
      path: {
        /** The calculationRequestId of the calculation */
        calculationRequestId: number
      }
    }
    responses: {
      /** Unauthorised, requires a valid Oauth2 token */
      401: {
        content: {
          'application/json': components['schemas']['CalculationUserInputs']
        }
      }
      /** Forbidden, requires an appropriate role */
      403: {
        content: {
          'application/json': components['schemas']['CalculationUserInputs']
        }
      }
      /** No calculation exists for this calculationRequestId */
      404: {
        content: {
          'application/json': components['schemas']['CalculationUserInputs']
        }
      }
    }
  }
  /** This endpoint will return the breakdown based on a calculationRequestId */
  getCalculationBreakdown: {
    parameters: {
      path: {
        /** The calculationRequestId of the breakdown */
        calculationRequestId: number
      }
    }
    responses: {
      /** Unauthorised, requires a valid Oauth2 token */
      401: {
        content: {
          'application/json': components['schemas']['CalculationBreakdown']
        }
      }
      /** Forbidden, requires an appropriate role */
      403: {
        content: {
          'application/json': components['schemas']['CalculationBreakdown']
        }
      }
      /** No calculation exists for this calculationRequestId */
      404: {
        content: {
          'application/json': components['schemas']['CalculationBreakdown']
        }
      }
    }
  }
  /** This endpoint will return the adjustments based on a calculationRequestId */
  get: {
    parameters: {
      path: {
        /** The calculationRequestId of the calculation */
        calculationRequestId: number
      }
    }
    responses: {
      /** Unauthorised, requires a valid Oauth2 token */
      401: {
        content: {
          'application/json': components['schemas']['BookingAndSentenceAdjustments']
        }
      }
      /** Forbidden, requires an appropriate role */
      403: {
        content: {
          'application/json': components['schemas']['BookingAndSentenceAdjustments']
        }
      }
      /** No calculation exists for this calculationRequestId */
      404: {
        content: {
          'application/json': components['schemas']['BookingAndSentenceAdjustments']
        }
      }
    }
  }
}

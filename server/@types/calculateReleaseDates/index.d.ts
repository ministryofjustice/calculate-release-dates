/* eslint-disable camelcase */
/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
  '/calculation/{prisonerId}': {
    /** This endpoint will calculate release dates based on a prisoners latest booking - this is a PRELIMINARY calculation that will not be published to NOMIS */
    post: operations['calculate']
  }
  '/calculation/results/{calculationRequestId}': {
    /** This endpoint will return the release dates based on a calculationRequestId */
    get: operations['getCalculationResults']
  }
  '/calculation/results/{prisonerId}/{bookingId}': {
    /** This endpoint will return the confirmed release dates based on a prisoners booking */
    get: operations['getConfirmedCalculationResults']
  }
  '/calculation/{prisonerId}/confirm/{calculationRequestId}': {
    /** This endpoint will calculate release dates based on a prisoners latest booking */
    post: operations['confirmCalculation']
  }
  '/working-day/next/{date}': {
    /** Finds the next working day, adjusting for weekends and bank holidays */
    get: operations['nextWorkingDay']
  }
  '/working-day/previous/{date}': {
    /** Finds the previous working day, adjusting for weekends and bank holidays */
    get: operations['previousWorkingDay']
  }
  '/test/calculation-by-booking': {
    /** This endpoint will calculate release dates based on a prisoners booking data (e.g. sentences and adjustments) */
    post: operations['calculate_1']
  }
  '/calculation/breakdown/{calculationRequestId}': {
    /** This endpoint will return the breakdown based on a calculationRequestId */
    get: operations['getCalculationBreakdown']
  }
}

export interface components {
  schemas: {
    BookingCalculation: {
      dates: { [key: string]: string }
      calculationRequestId: number
    }
    WorkingDay: {
      date: string
      adjustedForWeekend: boolean
      adjustedForBankHoliday: boolean
    }
    CalculationBreakdown: {
      concurrentSentences: components['schemas']['ConcurrentSentenceBreakdown'][]
      consecutiveSentence?: components['schemas']['ConsecutiveSentenceBreakdown']
    }
    ConcurrentSentenceBreakdown: {
      sentencedAt: string
      sentenceLength: string
      sentenceLengthDays: number
      dates: { [key: string]: components['schemas']['DateBreakdown'] }
      lineSequence: number
      caseSequence: number
    }
    ConsecutiveSentenceBreakdown: {
      sentencedAt: string
      sentenceLength: string
      sentenceLengthDays: number
      dates: { [key: string]: components['schemas']['DateBreakdown'] }
      sentenceParts: components['schemas']['ConsecutiveSentencePart'][]
    }
    ConsecutiveSentencePart: {
      lineSequence: number
      caseSequence: number
      sentenceLength: string
      sentenceLengthDays: number
      consecutiveToLineSequence?: number
      consecutiveToCaseSequence?: number
    }
    DateBreakdown: {
      unadjusted: string
      adjusted: string
      daysFromSentenceStart: number
      adjustedByDays: number
    }
  }
}

export interface operations {
  /** This endpoint will calculate release dates based on a prisoners latest booking - this is a PRELIMINARY calculation that will not be published to NOMIS */
  calculate: {
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
          'application/json': components['schemas']['BookingCalculation']
        }
      }
      /** Forbidden, requires an appropriate role */
      403: {
        content: {
          'application/json': components['schemas']['BookingCalculation']
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
          'application/json': components['schemas']['BookingCalculation']
        }
      }
      /** Forbidden, requires an appropriate role */
      403: {
        content: {
          'application/json': components['schemas']['BookingCalculation']
        }
      }
      /** No calculation exists for this calculationRequestId */
      404: {
        content: {
          'application/json': components['schemas']['BookingCalculation']
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
          'application/json': components['schemas']['BookingCalculation']
        }
      }
      /** Forbidden, requires an appropriate role */
      403: {
        content: {
          'application/json': components['schemas']['BookingCalculation']
        }
      }
      /** No confirmed calculation exists for this prisoner and booking */
      404: {
        content: {
          'application/json': components['schemas']['BookingCalculation']
        }
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
          'application/json': components['schemas']['BookingCalculation']
        }
      }
      /** Forbidden, requires an appropriate role */
      403: {
        content: {
          'application/json': components['schemas']['BookingCalculation']
        }
      }
      /** No calculation exists for the passed calculationRequestId or the write to NOMIS has failed */
      404: {
        content: {
          'application/json': components['schemas']['BookingCalculation']
        }
      }
      /** The booking data that was used for the preliminary calculation has changed */
      412: {
        content: {
          'application/json': components['schemas']['BookingCalculation']
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
  /** This endpoint will calculate release dates based on a prisoners booking data (e.g. sentences and adjustments) */
  calculate_1: {
    responses: {
      /** Unauthorised, requires a valid Oauth2 token */
      401: {
        content: {
          'application/json': components['schemas']['BookingCalculation']
        }
      }
      /** Forbidden, requires an appropriate role */
      403: {
        content: {
          'application/json': components['schemas']['BookingCalculation']
        }
      }
    }
    requestBody: {
      content: {
        'application/json': string
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
}

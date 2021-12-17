import CalculateReleaseDatesApiClient from '../api/calculateReleaseDatesApiClient'
import HmppsAuthClient from '../api/hmppsAuthClient'
import {
  BookingCalculation,
  CalculationBreakdown,
  DateBreakdown,
  WorkingDay,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'
import ErrorMessage from '../types/ErrorMessage'
import { ErrorMessages, ErrorMessageType } from '../types/ErrorMessages'
import logger from '../../logger'

export default class CalculateReleaseDatesService {
  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {}

  private readonly expiryDateTypesForBreakdown: ReadonlyArray<string> = ['SLED', 'SED']

  private readonly releaseDateTypesForBreakdown: ReadonlyArray<string> = ['CRD', 'ARD']

  private readonly supportedSentences: ReadonlyArray<string> = [
    'ADIMP',
    'ADIMP_ORA',
    'YOI',
    'YOI_ORA',
    'SEC91_03',
    'SEC91_03_ORA',
    'SEC250',
    'SEC250_ORA',
  ]

  // TODO test method - will be removed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
  async calculateReleaseDates(username: string, booking: any, token: string): Promise<BookingCalculation> {
    const bookingData = JSON.parse(booking)
    return new CalculateReleaseDatesApiClient(token).calculateReleaseDates(bookingData)
  }

  async calculatePreliminaryReleaseDates(
    username: string,
    prisonerId: string,
    token: string
  ): Promise<BookingCalculation> {
    return new CalculateReleaseDatesApiClient(token).calculatePreliminaryReleaseDates(prisonerId)
  }

  async getCalculationResults(
    username: string,
    calculationRequestId: number,
    token: string
  ): Promise<BookingCalculation> {
    return new CalculateReleaseDatesApiClient(token).getCalculationResults(calculationRequestId)
  }

  async getCalculationBreakdownAndEffectiveDates(
    calculationRequestId: number,
    token: string,
    releaseDates: BookingCalculation
  ): Promise<{
    calculationBreakdown?: CalculationBreakdown
    effectiveDates?: { [key: string]: DateBreakdown }
  }> {
    try {
      const breakdown = await this.getCalculationBreakdown(calculationRequestId, token)
      return {
        calculationBreakdown: breakdown,
        effectiveDates: this.getEffectiveDates(releaseDates, breakdown),
      }
    } catch (error) {
      // If an error happens in this breakdown, still display the release dates.
      logger.error(error)
      return {
        calculationBreakdown: null,
        effectiveDates: null,
      }
    }
  }

  private async getCalculationBreakdown(calculationRequestId: number, token: string): Promise<CalculationBreakdown> {
    return new CalculateReleaseDatesApiClient(token).getCalculationBreakdown(calculationRequestId)
  }

  // Find which sentence provides effective dates.
  private getEffectiveDates(
    releaseDates: BookingCalculation,
    calculationBreakdown: CalculationBreakdown
  ): { [key: string]: DateBreakdown } {
    const dates = {}
    Object.keys(releaseDates.dates)
      .filter(
        dateType =>
          this.expiryDateTypesForBreakdown.includes(dateType) || this.releaseDateTypesForBreakdown.includes(dateType)
      )
      .forEach(dateType => {
        dates[dateType] = this.findEffectiveDateBreakdownForGivenReleaseDateType(
          dateType,
          releaseDates.dates[dateType],
          calculationBreakdown
        )
      })
    return dates
  }

  private findEffectiveDateBreakdownForGivenReleaseDateType(
    dateType: string,
    date: string,
    calculationBreakdown: CalculationBreakdown
  ): DateBreakdown {
    const concurrentFind = calculationBreakdown.concurrentSentences
      .map(it => this.isSentenceProvidingTheEffectiveDate(dateType, date, it.dates))
      .find(it => !!it)
    if (concurrentFind) {
      return concurrentFind
    }
    if (calculationBreakdown.consecutiveSentence?.dates) {
      const consecutiveFind = this.isSentenceProvidingTheEffectiveDate(
        dateType,
        date,
        calculationBreakdown.consecutiveSentence.dates
      )
      if (consecutiveFind) {
        return consecutiveFind
      }
    }
    logger.error(`Couldn't find the DateBreakdown for effective date type ${dateType}`)
    // If we can't find the breakdown for the effective date, just return a blank date
    // breakdown so that the rest of the breakdown still renders
    return {
      adjusted: date,
      adjustedByDays: 0,
      daysFromSentenceStart: 0,
      unadjusted: '',
    }
  }

  /*
  We need to find which sentence is providing the effective dates.
  Firstly check if sentence contains the same type of date and that it matches
  Seccondly check if it contains a matching release/expiry date
  */
  private isSentenceProvidingTheEffectiveDate(
    dateType: string,
    date: string,
    dates: { [key: string]: DateBreakdown }
  ): DateBreakdown {
    const sameType = dates[dateType]
    if (sameType) {
      if (sameType.adjusted === date) {
        return sameType
      }
      // If the sentence doesn't contain the exact same type i.e SLED. Then check if it contains the same expiry date (i.e it could be a SED in the effective dates)
    } else if (this.expiryDateTypesForBreakdown.includes(dateType)) {
      const expiry = dates[this.expiryDateTypesForBreakdown.find(type => dates[type])]
      if (expiry && expiry.adjusted === date) {
        return expiry
      }
    } else if (this.releaseDateTypesForBreakdown.includes(dateType)) {
      const release = dates[this.releaseDateTypesForBreakdown.find(type => dates[type])]
      if (release && release.adjusted === date) {
        return release
      }
    }
    return null
  }

  async confirmCalculation(
    username: string,
    prisonerId: string,
    calculationRequestId: number,
    token: string
  ): Promise<BookingCalculation> {
    return new CalculateReleaseDatesApiClient(token).confirmCalculation(prisonerId, calculationRequestId)
  }

  async getWeekendAdjustments(
    username: string,
    calculation: BookingCalculation,
    token: string
  ): Promise<{ [key: string]: WorkingDay }> {
    const client = new CalculateReleaseDatesApiClient(token)
    const adjustments: { [key: string]: WorkingDay } = {}
    if (calculation.dates.CRD) {
      const adjustment = await client.getPreviousWorkingDay(calculation.dates.CRD)
      if (adjustment.date !== calculation.dates.CRD) {
        adjustments.CRD = adjustment
      }
    }
    if (calculation.dates.ARD) {
      const adjustment = await client.getPreviousWorkingDay(calculation.dates.ARD)
      if (adjustment.date !== calculation.dates.ARD) {
        adjustments.ARD = adjustment
      }
    }
    if (calculation.dates.HDCED) {
      const adjustment = await client.getNextWorkingDay(calculation.dates.HDCED)
      if (adjustment.date !== calculation.dates.HDCED) {
        adjustments.HDCED = adjustment
      }
    }
    return adjustments
  }

  sortByCaseNumberAndLineSequence = (a: SentenceError, b: SentenceError): number => {
    if (a.sentence.caseSequence > b.sentence.caseSequence) return 1
    if (a.sentence.caseSequence < b.sentence.caseSequence) return -1
    return a.sentence.lineSequence - b.sentence.lineSequence
  }

  validateNomisInformation(sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[]): ErrorMessages {
    const unsupportedErrors = this.validateSupportedSentences(sentencesAndOffences)
    if (unsupportedErrors.messages.length) {
      return unsupportedErrors
    }
    return {
      messages: this.valdiateOffences(sentencesAndOffences)
        .sort(this.sortByCaseNumberAndLineSequence)
        .map(e => e.error),
      messageType: ErrorMessageType.VALIDATION,
    }
  }

  private validateSupportedSentences(sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[]): ErrorMessages {
    const sentenceErrors: SentenceError[] = sentencesAndOffences
      .filter(s => !this.supportedSentences.includes(s.sentenceCalculationType))
      .map(s => {
        return {
          sentence: s,
          error: {
            text: s.sentenceTypeDescription,
          },
        }
      })
      .sort(this.sortByCaseNumberAndLineSequence)

    return {
      messages: sentenceErrors.map(e => e.error),
      messageType: ErrorMessageType.UNSUPPORTED,
    }
  }

  private valdiateOffences(sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[]): SentenceError[] {
    let errors: SentenceError[] = []
    sentencesAndOffences.forEach(sentencesAndOffence => {
      errors = [
        ...errors,
        ...this.validateWithoutOffenceDate(sentencesAndOffence),
        ...this.validateOffenceDateAfterSentenceDate(sentencesAndOffence),
        ...this.validateOffenceRangeDateAfterSentenceDate(sentencesAndOffence),
        ...this.validateDurationNotZero(sentencesAndOffence),
      ]
    })
    return errors
  }

  private validateOffenceDateAfterSentenceDate(
    sentencesAndOffence: PrisonApiOffenderSentenceAndOffences
  ): SentenceError[] {
    const invalid = sentencesAndOffence.offences.some(
      o => o.offenceStartDate && o.offenceStartDate > sentencesAndOffence.sentenceDate
    )
    if (invalid) {
      return [
        {
          sentence: sentencesAndOffence,
          error: {
            text: `The offence date for court case ${sentencesAndOffence.caseSequence} count ${sentencesAndOffence.lineSequence} must be before the sentence date.`,
          },
        },
      ]
    }
    return []
  }

  private validateOffenceRangeDateAfterSentenceDate(
    sentencesAndOffence: PrisonApiOffenderSentenceAndOffences
  ): SentenceError[] {
    const invalid = sentencesAndOffence.offences.some(
      o => o.offenceEndDate && o.offenceEndDate > sentencesAndOffence.sentenceDate
    )
    if (invalid) {
      return [
        {
          sentence: sentencesAndOffence,
          error: {
            text: `The offence date range for court case ${sentencesAndOffence.caseSequence} count ${sentencesAndOffence.lineSequence} must be before the sentence date.`,
          },
        },
      ]
    }
    return []
  }

  private validateDurationNotZero(sentencesAndOffence: PrisonApiOffenderSentenceAndOffences): SentenceError[] {
    const invalid =
      !sentencesAndOffence.days &&
      !sentencesAndOffence.weeks &&
      !sentencesAndOffence.months &&
      !sentencesAndOffence.years
    if (invalid) {
      return [
        {
          sentence: sentencesAndOffence,
          error: {
            text: `You must enter a length of time for the term of imprisonment for court case ${sentencesAndOffence.caseSequence} count ${sentencesAndOffence.lineSequence}.`,
          },
        },
      ]
    }
    return []
  }

  private validateWithoutOffenceDate(sentencesAndOffence: PrisonApiOffenderSentenceAndOffences): SentenceError[] {
    const invalid = sentencesAndOffence.offences.some(o => !o.offenceEndDate && !o.offenceStartDate)
    if (invalid) {
      return [
        {
          sentence: sentencesAndOffence,
          error: {
            text: `The calculation must include an offence date for court case ${sentencesAndOffence.caseSequence} count ${sentencesAndOffence.lineSequence}`,
          },
        },
      ]
    }
    return []
  }
}

type SentenceError = {
  sentence: PrisonApiOffenderSentenceAndOffences
  error: ErrorMessage
}

import s from 'connect-redis'
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

export default class CalculateReleaseDatesService {
  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {}

  private readonly dateTypesForBreakdown: ReadonlyArray<string> = ['SLED', 'SED', 'CRD', 'ARD', 'PED']

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

  async getCalculationBreakdown(
    username: string,
    calculationRequestId: number,
    token: string
  ): Promise<CalculationBreakdown> {
    return new CalculateReleaseDatesApiClient(token).getCalculationBreakdown(calculationRequestId)
  }

  // Find which sentence provides effective dates.
  getEffectiveDates(
    releaseDates: BookingCalculation,
    calculationBreakdown: CalculationBreakdown
  ): { [key: string]: DateBreakdown } {
    const dates = {}
    Object.keys(releaseDates.dates)
      .filter(dateType => this.dateTypesForBreakdown.includes(dateType))
      .forEach(dateType => {
        dates[dateType] = this.findDateBreakdown(dateType, releaseDates.dates[dateType], calculationBreakdown)
      })
    return dates
  }

  private findDateBreakdown(dateType: string, date: string, calculationBreakdown: CalculationBreakdown): DateBreakdown {
    const concurrentFind = calculationBreakdown.concurrentSentences
      .map(it => it.dates[dateType])
      .find(it => it?.adjusted === date)
    if (!concurrentFind) {
      return calculationBreakdown.consecutiveSentence?.dates
        ? calculationBreakdown.consecutiveSentence?.dates[dateType]
        : null
    }
    return concurrentFind
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

  validateNomisInformation(sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[]): ErrorMessage[] {
    return this.valdiateOffences(sentencesAndOffences)
      .sort(this.sortByCaseNumberAndLineSequence)
      .map(e => e.error)
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
            text: `You must enter a length of time for the term of imprisonment for ${sentencesAndOffence.caseSequence} count ${sentencesAndOffence.lineSequence}.`,
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

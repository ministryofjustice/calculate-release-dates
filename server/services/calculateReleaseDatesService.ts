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

  sortByCaseNumberAndLineSequence = (
    a: PrisonApiOffenderSentenceAndOffences,
    b: PrisonApiOffenderSentenceAndOffences
  ): number => {
    if (a.caseSequence > b.caseSequence) return 1
    if (a.caseSequence < b.caseSequence) return -1
    return a.lineSequence - b.lineSequence
  }

  validateNomisInformation(sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[]): ErrorMessage[] {
    return this.checkForMissingOffenceDates(sentencesAndOffences)
  }

  private checkForMissingOffenceDates(sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[]): ErrorMessage[] {
    const sentencesWithoutOffenceDates = sentencesAndOffences.filter(s =>
      s.offences.some(o => !o.offenceEndDate && !o.offenceStartDate)
    )

    return sentencesWithoutOffenceDates.sort(this.sortByCaseNumberAndLineSequence).map(s => {
      return {
        text: `The calculation must include an offence date for court case ${s.caseSequence} count ${s.lineSequence}`,
      }
    })
  }
}

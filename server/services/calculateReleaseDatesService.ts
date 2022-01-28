import CalculateReleaseDatesApiClient from '../api/calculateReleaseDatesApiClient'
import HmppsAuthClient from '../api/hmppsAuthClient'
import {
  BookingCalculation,
  CalculationBreakdown,
  DateBreakdown,
  WorkingDay,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'
import { ErrorMessages, ErrorMessageType } from '../types/ErrorMessages'
import logger from '../../logger'
import CalculationRule from '../enumerations/calculationRule'
import ReleaseDateWithAdjustments from '../@types/calculateReleaseDates/releaseDateWithAdjustments'
import { longDateFormat, arithmeticToWords, daysArithmeticToWords } from '../utils/utils'
import ReleaseDateType from '../enumerations/releaseDateType'
import { RulesWithExtraAdjustments } from '../@types/calculateReleaseDates/rulesWithExtraAdjustments'

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
    releaseDatesWithAdjustments: ReleaseDateWithAdjustments[]
  }> {
    try {
      const breakdown = await this.getCalculationBreakdown(calculationRequestId, token)
      return {
        calculationBreakdown: breakdown,
        effectiveDates: this.getEffectiveDates(releaseDates, breakdown),
        releaseDatesWithAdjustments: this.extractReleaseDatesWithAdjustments(breakdown),
      }
    } catch (error) {
      // If an error happens in this breakdown, still display the release dates.
      logger.error(error)
      return {
        calculationBreakdown: null,
        effectiveDates: null,
        releaseDatesWithAdjustments: null,
      }
    }
  }

  // TODO expand this functionality to retrieve the 'other key dates with adjustments' based on the rules from the
  //  api call, e.g. CRD and SLED
  private extractReleaseDatesWithAdjustments(breakdown: CalculationBreakdown): ReleaseDateWithAdjustments[] {
    const releaseDatesWithAdjustments: ReleaseDateWithAdjustments[] = []
    if (breakdown.breakdownByReleaseDateType.HDCED) {
      const hdcedDetails = breakdown.breakdownByReleaseDateType.HDCED
      releaseDatesWithAdjustments.push(
        this.hdcedRulesToAdjustmentRow(
          hdcedDetails.rules,
          hdcedDetails.rulesWithExtraAdjustments as unknown as RulesWithExtraAdjustments,
          hdcedDetails.releaseDate,
          hdcedDetails.unadjustedDate,
          hdcedDetails.adjustedDays
        )
      )
    }
    if (breakdown.breakdownByReleaseDateType.TUSED) {
      const tusedDetails = breakdown.breakdownByReleaseDateType.TUSED
      releaseDatesWithAdjustments.push(
        this.tusedRulesToAdjustmentRow(
          tusedDetails.rules,
          tusedDetails.rulesWithExtraAdjustments as unknown as RulesWithExtraAdjustments,
          tusedDetails.releaseDate,
          tusedDetails.unadjustedDate,
          tusedDetails.adjustedDays
        )
      )
    }
    return releaseDatesWithAdjustments
  }

  private hdcedRulesToAdjustmentRow(
    rules: string[],
    rulesWithExtraAdjustments: RulesWithExtraAdjustments,
    releaseDate: string,
    unadjustedDate: string,
    adjustedDays: number
  ): ReleaseDateWithAdjustments {
    if (rules.includes(CalculationRule.HDCED_MINIMUM_14D)) {
      const ruleSpecificAdjustment = rulesWithExtraAdjustments.HDCED_MINIMUM_14D
      return this.createHDCEDAdjustmentRow(
        releaseDate,
        `${longDateFormat(unadjustedDate)} ${arithmeticToWords(ruleSpecificAdjustment)}`
      )
    }

    if (rules.includes(CalculationRule.HDCED_GE_12W_LT_18M)) {
      const ruleSpecificAdjustment = rulesWithExtraAdjustments.HDCED_GE_12W_LT_18M
      return this.createHDCEDAdjustmentRow(
        releaseDate,
        `${longDateFormat(unadjustedDate)} ${arithmeticToWords(ruleSpecificAdjustment)} ${daysArithmeticToWords(
          adjustedDays
        )}`
      )
    }

    if (rules.includes(CalculationRule.HDCED_GE_18M_LT_4Y)) {
      const ruleSpecificAdjustment = rulesWithExtraAdjustments.HDCED_GE_18M_LT_4Y
      return this.createHDCEDAdjustmentRow(
        releaseDate,
        `${longDateFormat(unadjustedDate)} ${arithmeticToWords(ruleSpecificAdjustment)}`
      )
    }
    return null
  }

  private tusedRulesToAdjustmentRow(
    rules: string[],
    rulesWithExtraAdjustments: RulesWithExtraAdjustments,
    releaseDate: string,
    unadjustedDate: string,
    adjustedDays: number
  ): ReleaseDateWithAdjustments {
    if (rules.includes(CalculationRule.TUSED_LICENCE_PERIOD_LT_1Y)) {
      const ruleSpecificAdjustment = rulesWithExtraAdjustments[CalculationRule.TUSED_LICENCE_PERIOD_LT_1Y]
      return this.createTUSEDAdjustmentRow(
        releaseDate,
        `${longDateFormat(unadjustedDate)} ${arithmeticToWords(ruleSpecificAdjustment)} ${daysArithmeticToWords(
          adjustedDays
        )}`
      )
    }
    return null
  }

  private createHDCEDAdjustmentRow(releaseDate: string, hintText: string): ReleaseDateWithAdjustments {
    return {
      releaseDate,
      releaseDateType: ReleaseDateType.HDCED,
      hintText,
    }
  }

  private createTUSEDAdjustmentRow(releaseDate: string, hintText: string): ReleaseDateWithAdjustments {
    return {
      releaseDate,
      releaseDateType: ReleaseDateType.TUSED,
      hintText,
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

  async validateBackend(
    prisonId: string,
    sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
    token: string
  ): Promise<ErrorMessages> {
    const errors = await new CalculateReleaseDatesApiClient(token).validate(prisonId)

    if (Object.keys(errors).length) {
      return {
        messageType: errors.type === 'UNSUPPORTED' ? ErrorMessageType.UNSUPPORTED : ErrorMessageType.VALIDATION,
        messages: errors.messages.map(e => {
          return {
            text: this.mapServerErrorToString(e, sentencesAndOffences),
          }
        }),
      }
    }
    return { messages: [] }
  }

  private mapServerErrorToString(
    e: {
      message: string
      code:
        | 'UNSUPPORTED_SENTENCE_TYPE'
        | 'OFFENCE_DATE_AFTER_SENTENCE_START_DATE'
        | 'OFFENCE_DATE_AFTER_SENTENCE_RANGE_DATE'
        | 'SENTENCE_HAS_NO_DURATION'
        | 'OFFENCE_MISSING_DATE'
        | 'REMAND_FROM_TO_DATES_REQUIRED'
      sentenceSequence?: number
      arguments: string[]
    },
    sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[]
  ): string {
    const sentencesAndOffence =
      e.sentenceSequence && sentencesAndOffences.find(s => s.sentenceSequence === e.sentenceSequence)
    switch (e.code) {
      case 'UNSUPPORTED_SENTENCE_TYPE':
        return e.arguments[0]
      case 'OFFENCE_DATE_AFTER_SENTENCE_START_DATE':
        return `The offence date for court case ${sentencesAndOffence.caseSequence} count ${sentencesAndOffence.lineSequence} must be before the sentence date.`
      case 'OFFENCE_DATE_AFTER_SENTENCE_RANGE_DATE':
        return `The offence date range for court case ${sentencesAndOffence.caseSequence} count ${sentencesAndOffence.lineSequence} must be before the sentence date.`
      case 'SENTENCE_HAS_NO_DURATION':
        return `You must enter a length of time for the term of imprisonment for court case ${sentencesAndOffence.caseSequence} count ${sentencesAndOffence.lineSequence}.`
      case 'OFFENCE_MISSING_DATE':
        return `The calculation must include an offence date for court case ${sentencesAndOffence.caseSequence} count ${sentencesAndOffence.lineSequence}`
      case 'REMAND_FROM_TO_DATES_REQUIRED':
        return `Remand periods must have a from and to date`
      default:
        throw new Error(`Uknown validation code ${e.code}`)
    }
  }
}

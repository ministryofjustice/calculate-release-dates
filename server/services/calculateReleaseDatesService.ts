import CalculateReleaseDatesApiClient from '../api/calculateReleaseDatesApiClient'
import {
  BookingCalculation,
  CalculationBreakdown,
  CalculationFragments,
  ReleaseDateCalculationBreakdown,
  ValidationMessage,
  WorkingDay,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'
import { ErrorMessages, ErrorMessageType } from '../types/ErrorMessages'
import logger from '../../logger'
import CalculationRule from '../enumerations/calculationRule'
import ReleaseDateWithAdjustments from '../@types/calculateReleaseDates/releaseDateWithAdjustments'
import { arithmeticToWords, daysArithmeticToWords, longDateFormat } from '../utils/utils'
import ReleaseDateType from '../enumerations/releaseDateType'
import { RulesWithExtraAdjustments } from '../@types/calculateReleaseDates/rulesWithExtraAdjustments'

export default class CalculateReleaseDatesService {
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

  async getBreakdown(
    calculationRequestId: number,
    token: string
  ): Promise<{
    calculationBreakdown?: CalculationBreakdown
    releaseDatesWithAdjustments: ReleaseDateWithAdjustments[]
  }> {
    try {
      const breakdown = await this.getCalculationBreakdown(calculationRequestId, token)
      return {
        calculationBreakdown: breakdown,
        releaseDatesWithAdjustments: this.extractReleaseDatesWithAdjustments(breakdown),
      }
    } catch (error) {
      // If an error happens in this breakdown, still display the release dates.
      logger.error(error)
      return {
        calculationBreakdown: null,
        releaseDatesWithAdjustments: null,
      }
    }
  }

  private extractReleaseDatesWithAdjustments(breakdown: CalculationBreakdown): ReleaseDateWithAdjustments[] {
    const releaseDatesWithAdjustments: ReleaseDateWithAdjustments[] = []
    if (breakdown.breakdownByReleaseDateType.SLED || breakdown.breakdownByReleaseDateType.SED) {
      CalculateReleaseDatesService.standardAdjustmentRow(
        breakdown.breakdownByReleaseDateType.SLED ? ReleaseDateType.SLED : ReleaseDateType.SED,
        breakdown.breakdownByReleaseDateType.SLED || breakdown.breakdownByReleaseDateType.SED,
        releaseDatesWithAdjustments
      )
    }
    if (breakdown.breakdownByReleaseDateType.CRD || breakdown.breakdownByReleaseDateType.ARD) {
      CalculateReleaseDatesService.standardAdjustmentRow(
        breakdown.breakdownByReleaseDateType.CRD ? ReleaseDateType.CRD : ReleaseDateType.ARD,
        breakdown.breakdownByReleaseDateType.CRD || breakdown.breakdownByReleaseDateType.ARD,
        releaseDatesWithAdjustments
      )
    }
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

  private static standardAdjustmentRow(
    releaseDateType: ReleaseDateType,
    releaseDateCalculationBreakdown: ReleaseDateCalculationBreakdown,
    releaseDatesWithAdjustments: ReleaseDateWithAdjustments[]
  ) {
    releaseDatesWithAdjustments.push(
      CalculateReleaseDatesService.createAdjustmentRow(
        releaseDateCalculationBreakdown.releaseDate,
        releaseDateType,
        `${longDateFormat(releaseDateCalculationBreakdown.unadjustedDate)} ${daysArithmeticToWords(
          releaseDateCalculationBreakdown.adjustedDays
        )}`
      )
    )
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
      return CalculateReleaseDatesService.createAdjustmentRow(
        releaseDate,
        ReleaseDateType.HDCED,
        `${longDateFormat(unadjustedDate)} ${arithmeticToWords(ruleSpecificAdjustment)}`
      )
    }

    if (rules.includes(CalculationRule.HDCED_GE_12W_LT_18M)) {
      const ruleSpecificAdjustment = rulesWithExtraAdjustments.HDCED_GE_12W_LT_18M
      return CalculateReleaseDatesService.createAdjustmentRow(
        releaseDate,
        ReleaseDateType.HDCED,
        `${longDateFormat(unadjustedDate)} ${arithmeticToWords(ruleSpecificAdjustment)} ${daysArithmeticToWords(
          adjustedDays
        )}`
      )
    }

    if (rules.includes(CalculationRule.HDCED_GE_18M_LT_4Y)) {
      const ruleSpecificAdjustment = rulesWithExtraAdjustments.HDCED_GE_18M_LT_4Y
      return CalculateReleaseDatesService.createAdjustmentRow(
        releaseDate,
        ReleaseDateType.HDCED,
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
      return CalculateReleaseDatesService.createAdjustmentRow(
        releaseDate,
        ReleaseDateType.TUSED,
        `${longDateFormat(unadjustedDate)} ${arithmeticToWords(ruleSpecificAdjustment)} ${daysArithmeticToWords(
          adjustedDays
        )}`
      )
    }
    return null
  }

  private static createAdjustmentRow(
    releaseDate: string,
    releaseDateType: ReleaseDateType,
    hintText: string
  ): ReleaseDateWithAdjustments {
    return {
      releaseDate,
      releaseDateType,
      hintText,
    }
  }

  private async getCalculationBreakdown(calculationRequestId: number, token: string): Promise<CalculationBreakdown> {
    return new CalculateReleaseDatesApiClient(token).getCalculationBreakdown(calculationRequestId)
  }

  async confirmCalculation(
    username: string,
    prisonerId: string,
    calculationRequestId: number,
    token: string,
    body: CalculationFragments
  ): Promise<BookingCalculation> {
    return new CalculateReleaseDatesApiClient(token).confirmCalculation(prisonerId, calculationRequestId, body)
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
    validationMessage: ValidationMessage,
    sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[]
  ): string {
    const sentencesAndOffence =
      validationMessage.sentenceSequence &&
      sentencesAndOffences.find(s => s.sentenceSequence === validationMessage.sentenceSequence)
    switch (validationMessage.code) {
      case 'UNSUPPORTED_SENTENCE_TYPE':
        return validationMessage.arguments[0]
      case 'OFFENCE_DATE_AFTER_SENTENCE_START_DATE':
        return `The offence date for court case ${sentencesAndOffence.caseSequence} count ${sentencesAndOffence.lineSequence} must be before the sentence date.`
      case 'OFFENCE_DATE_AFTER_SENTENCE_RANGE_DATE':
        return `The offence date range for court case ${sentencesAndOffence.caseSequence} count ${sentencesAndOffence.lineSequence} must be before the sentence date.`
      case 'SENTENCE_HAS_NO_DURATION':
        return `You must enter a length of time for the term of imprisonment for court case ${sentencesAndOffence.caseSequence} count ${sentencesAndOffence.lineSequence}.`
      case 'OFFENCE_MISSING_DATE':
        return `The calculation must include an offence date for court case ${sentencesAndOffence.caseSequence} count ${sentencesAndOffence.lineSequence}.`
      case 'REMAND_FROM_TO_DATES_REQUIRED':
        return `Remand periods must have a from and to date.`
      case 'REMAND_OVERLAPS_WITH_REMAND':
        return `Remand time can only be added once, it can cannot overlap with other remand dates.`
      case 'SENTENCE_HAS_MULTIPLE_TERMS':
        return `Each sentence must only have one term in NOMIS.`
      default:
        throw new Error(`Uknown validation code ${validationMessage.code}`)
    }
  }
}

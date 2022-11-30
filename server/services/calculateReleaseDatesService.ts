import CalculateReleaseDatesApiClient from '../api/calculateReleaseDatesApiClient'
import {
  BookingCalculation,
  CalculationBreakdown,
  CalculationFragments,
  CalculationUserInputs,
  CalculationUserQuestions,
  ReleaseDateCalculationBreakdown,
  SentenceDiagram,
  ValidationMessage,
  WorkingDay,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { ErrorMessages, ErrorMessageType } from '../types/ErrorMessages'
import logger from '../../logger'
import CalculationRule from '../enumerations/calculationRule'
import ReleaseDateWithAdjustments from '../@types/calculateReleaseDates/releaseDateWithAdjustments'
import { arithmeticToWords, daysArithmeticToWords, longDateFormat } from '../utils/utils'
import ReleaseDateType from '../enumerations/releaseDateType'
import { RulesWithExtraAdjustments } from '../@types/calculateReleaseDates/rulesWithExtraAdjustments'
import ErrorMessage from '../types/ErrorMessage'

export default class CalculateReleaseDatesService {
  // TODO test method - will be removed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
  async calculateReleaseDates(username: string, booking: any, token: string): Promise<BookingCalculation> {
    const bookingData = JSON.parse(booking)
    return new CalculateReleaseDatesApiClient(token).calculateReleaseDates(bookingData)
  }

  async calculateTestReleaseDates(
    username: string,
    prisonerId: string,
    userInput: CalculationUserInputs,
    token: string
  ): Promise<BookingCalculation> {
    return new CalculateReleaseDatesApiClient(token).calculateTestReleaseDates(prisonerId, userInput)
  }

  async calculatePreliminaryReleaseDates(
    username: string,
    prisonerId: string,
    userInput: CalculationUserInputs,
    token: string
  ): Promise<BookingCalculation> {
    return new CalculateReleaseDatesApiClient(token).calculatePreliminaryReleaseDates(prisonerId, userInput)
  }

  async getCalculationResults(
    username: string,
    calculationRequestId: number,
    token: string
  ): Promise<BookingCalculation> {
    return new CalculateReleaseDatesApiClient(token).getCalculationResults(calculationRequestId)
  }

  async getCalculationUserQuestions(prisonId: string, token: string): Promise<CalculationUserQuestions> {
    return new CalculateReleaseDatesApiClient(token).getCalculationUserQuestions(prisonId)
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

  async getSentenceDiagram(calculationRequestId: number, token: string): Promise<SentenceDiagram> {
    return new CalculateReleaseDatesApiClient(token).getSentenceDiagram(calculationRequestId)
  }

  private extractReleaseDatesWithAdjustments(breakdown: CalculationBreakdown): ReleaseDateWithAdjustments[] {
    const releaseDatesWithAdjustments: ReleaseDateWithAdjustments[] = []
    if (breakdown.breakdownByReleaseDateType.LED) {
      const ledDetails = breakdown.breakdownByReleaseDateType.LED
      releaseDatesWithAdjustments.push(
        this.ledRulesToAdjustmentRow(ledDetails.releaseDate, ledDetails.unadjustedDate, ledDetails.adjustedDays)
      )
    }
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

  private ledRulesToAdjustmentRow(
    releaseDate: string,
    unadjustedDate: string,
    adjustedDays: number
  ): ReleaseDateWithAdjustments {
    return CalculateReleaseDatesService.createAdjustmentRow(
      releaseDate,
      ReleaseDateType.LED,
      `${longDateFormat(unadjustedDate)} ${daysArithmeticToWords(adjustedDays)}`
    )
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

  public async getCalculationBreakdown(calculationRequestId: number, token: string): Promise<CalculationBreakdown> {
    return new CalculateReleaseDatesApiClient(token).getCalculationBreakdown(calculationRequestId)
  }

  async confirmCalculation(
    username: string,
    calculationRequestId: number,
    token: string,
    body: CalculationFragments
  ): Promise<BookingCalculation> {
    return new CalculateReleaseDatesApiClient(token).confirmCalculation(calculationRequestId, body)
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
    if (calculation.dates.PRRD) {
      const adjustment = await client.getPreviousWorkingDay(calculation.dates.PRRD)
      if (adjustment.date !== calculation.dates.PRRD) {
        adjustments.PRRD = adjustment
      }
    }
    if (calculation.dates.HDCED) {
      const adjustment = await client.getNextWorkingDay(calculation.dates.HDCED)
      if (adjustment.date !== calculation.dates.HDCED) {
        adjustments.HDCED = adjustment
      }
    }
    if (calculation.dates.PED) {
      const adjustment = await client.getPreviousWorkingDay(calculation.dates.PED)
      if (adjustment.date !== calculation.dates.PED) {
        adjustments.PED = adjustment
      }
    }
    return adjustments
  }

  async validateBackend(prisonId: string, userInput: CalculationUserInputs, token: string): Promise<ErrorMessages> {
    const validationMessages = await new CalculateReleaseDatesApiClient(token).validate(prisonId, userInput)
    return validationMessages.length ? this.convertMessages(validationMessages) : { messages: [] }
  }

  private convertMessages(validationMessages: ValidationMessage[]): ErrorMessages {
    const { type } = validationMessages[0] // atm all messages are of the same type for each run of the validation
    const messages = validationMessages.map(m => {
      return { text: m.message } as ErrorMessage
    })

    return {
      messageType: ErrorMessageType[type],
      messages,
    }
  }
}

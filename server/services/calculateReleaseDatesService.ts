import dayjs from 'dayjs'
import { Request } from 'express'
import CalculateReleaseDatesApiClient from '../api/calculateReleaseDatesApiClient'
import {
  AnalyzedSentenceAndOffences,
  BookingCalculation,
  CalculationBreakdown,
  CalculationReason,
  CalculationRequestModel,
  CalculationResults,
  CalculationUserInputs,
  CalculationUserQuestions,
  GenuineOverride,
  NonFridayReleaseDay,
  ReleaseDateCalculationBreakdown,
  SubmitCalculationRequest,
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
import config from '../config'
import { FullPageError } from '../types/FullPageError'
import { AnalyzedPrisonApiBookingAndSentenceAdjustments } from '../@types/prisonApi/prisonClientTypes'

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
    calculationRequestModel: CalculationRequestModel,
    token: string
  ): Promise<CalculationResults> {
    return new CalculateReleaseDatesApiClient(token).calculateTestReleaseDates(prisonerId, calculationRequestModel)
  }

  async calculatePreliminaryReleaseDates(
    username: string,
    prisonerId: string,
    calculationRequestModel: CalculationRequestModel,
    token: string
  ): Promise<BookingCalculation> {
    const b = await new CalculateReleaseDatesApiClient(token).calculatePreliminaryReleaseDates(
      prisonerId,
      calculationRequestModel
    )
    return b
  }

  async getCalculationResults(
    username: string,
    calculationRequestId: number,
    token: string
  ): Promise<BookingCalculation> {
    return new CalculateReleaseDatesApiClient(token).getCalculationResults(calculationRequestId)
  }

  async getCalculationResultsByReference(
    username: string,
    calculationReference: string,
    token: string,
    checkForChanges = false
  ): Promise<BookingCalculation> {
    return new CalculateReleaseDatesApiClient(token).getCalculationResultsByReference(
      calculationReference,
      checkForChanges
    )
  }

  async getCalculationUserQuestions(prisonId: string, token: string): Promise<CalculationUserQuestions> {
    return new CalculateReleaseDatesApiClient(token).getCalculationUserQuestions(prisonId)
  }

  async getUnsupportedSentenceOrCalculationMessages(prisonId: string, token: string): Promise<ValidationMessage[]> {
    return new CalculateReleaseDatesApiClient(token).getUnsupportedValidation(prisonId)
  }

  async getBookingAndSentenceAdjustments(
    bookingId: number,
    token: string
  ): Promise<AnalyzedPrisonApiBookingAndSentenceAdjustments> {
    return new CalculateReleaseDatesApiClient(token).getAnalyzedAdjustments(bookingId)
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

  async getCalculationRequestModel(
    req: Request,
    userInputs: CalculationUserInputs,
    nomsId: string
  ): Promise<CalculationRequestModel> {
    return {
      calculationUserInputs: userInputs,
      calculationReasonId: config.featureToggles.calculationReasonToggle ? req.session.calculationReasonId[nomsId] : '',
      otherReasonDescription: config.featureToggles.calculationReasonToggle
        ? req.session.otherReasonDescription[nomsId]
        : '',
    } as CalculationRequestModel
  }

  async getActiveAnalyzedSentencesAndOffences(
    username: string,
    bookingId: number,
    token: string
  ): Promise<AnalyzedSentenceAndOffences[]> {
    const sentencesAndOffences = await new CalculateReleaseDatesApiClient(token).getAnalyzedSentencesAndOffences(
      bookingId
    )
    if (sentencesAndOffences.length === 0) {
      throw FullPageError.noSentences()
    }
    return sentencesAndOffences.filter((s: AnalyzedSentenceAndOffences) => s.sentenceStatus === 'A')
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
    if (breakdown.breakdownByReleaseDateType.ERSED) {
      const ersedDetails = breakdown.breakdownByReleaseDateType.ERSED
      if (
        !(
          ersedDetails.rules.includes('ERSED_ADJUSTED_TO_CONCURRENT_TERM') ||
          ersedDetails.rules.includes('ERSED_BEFORE_SENTENCE_DATE')
        )
      ) {
        releaseDatesWithAdjustments.push(
          this.ersedRulesToAdjustmentRow(
            ersedDetails.rules,
            ersedDetails.rulesWithExtraAdjustments as unknown as RulesWithExtraAdjustments,
            ersedDetails.releaseDate,
            ersedDetails.unadjustedDate,
            ersedDetails.adjustedDays
          )
        )
      }
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
    if (rules.includes(CalculationRule.HDCED_MINIMUM_CUSTODIAL_PERIOD)) {
      const ruleSpecificAdjustment = rulesWithExtraAdjustments.HDCED_MINIMUM_CUSTODIAL_PERIOD
      return CalculateReleaseDatesService.createAdjustmentRow(
        releaseDate,
        ReleaseDateType.HDCED,
        `${longDateFormat(unadjustedDate)} ${arithmeticToWords(ruleSpecificAdjustment)}`
      )
    }

    if (rules.includes(CalculationRule.HDCED_GE_MIN_PERIOD_LT_MIDPOINT)) {
      const ruleSpecificAdjustment = rulesWithExtraAdjustments.HDCED_GE_MIN_PERIOD_LT_MIDPOINT
      return CalculateReleaseDatesService.createAdjustmentRow(
        releaseDate,
        ReleaseDateType.HDCED,
        `${longDateFormat(unadjustedDate)} ${arithmeticToWords(ruleSpecificAdjustment)} ${daysArithmeticToWords(
          adjustedDays
        )}`
      )
    }

    if (rules.includes(CalculationRule.HDCED_GE_MIDPOINT_LT_MAX_PERIOD)) {
      const ruleSpecificAdjustment = rulesWithExtraAdjustments.HDCED_GE_MIDPOINT_LT_MAX_PERIOD
      return CalculateReleaseDatesService.createAdjustmentRow(
        releaseDate,
        ReleaseDateType.HDCED,
        `${longDateFormat(unadjustedDate)} ${arithmeticToWords(ruleSpecificAdjustment)}`
      )
    }
    return null
  }

  private ersedRulesToAdjustmentRow(
    rules: string[],
    rulesWithExtraAdjustments: RulesWithExtraAdjustments,
    releaseDate: string,
    unadjustedDate: string,
    adjustedDays: number
  ): ReleaseDateWithAdjustments {
    if (rules.includes('ERSED_ONE_YEAR')) {
      const ruleSpecificAdjustment = rulesWithExtraAdjustments.ERSED_ONE_YEAR
      return CalculateReleaseDatesService.createAdjustmentRow(
        releaseDate,
        ReleaseDateType.ERSED,
        `${longDateFormat(unadjustedDate)} ${daysArithmeticToWords(adjustedDays)} ${arithmeticToWords(
          ruleSpecificAdjustment
        )}`
      )
    }
    return CalculateReleaseDatesService.createAdjustmentRow(
      releaseDate,
      ReleaseDateType.ERSED,
      `${longDateFormat(unadjustedDate)} ${daysArithmeticToWords(adjustedDays)}`
    )
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

  public async getCalculationReasons(token: string): Promise<CalculationReason[]> {
    return new CalculateReleaseDatesApiClient(token).getCalculationReasons()
  }

  async confirmCalculation(
    username: string,
    calculationRequestId: number,
    token: string,
    body: SubmitCalculationRequest
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
    if (this.existsAndIsInFuture(calculation.dates.CRD)) {
      const adjustment = await client.getPreviousWorkingDay(calculation.dates.CRD)
      if (adjustment.date !== calculation.dates.CRD) {
        adjustments.CRD = adjustment
      }
    }
    if (this.existsAndIsInFuture(calculation.dates.ARD)) {
      const adjustment = await client.getPreviousWorkingDay(calculation.dates.ARD)
      if (adjustment.date !== calculation.dates.ARD) {
        adjustments.ARD = adjustment
      }
    }
    if (this.existsAndIsInFuture(calculation.dates.PRRD)) {
      const adjustment = await client.getPreviousWorkingDay(calculation.dates.PRRD)
      if (adjustment.date !== calculation.dates.PRRD) {
        adjustments.PRRD = adjustment
      }
    }
    if (this.existsAndIsInFuture(calculation.dates.HDCED)) {
      const adjustment = await client.getNextWorkingDay(calculation.dates.HDCED)
      if (adjustment.date !== calculation.dates.HDCED) {
        adjustments.HDCED = adjustment
      }
    }
    if (this.existsAndIsInFuture(calculation.dates.PED)) {
      const adjustment = await client.getPreviousWorkingDay(calculation.dates.PED)
      if (adjustment.date !== calculation.dates.PED) {
        adjustments.PED = adjustment
      }
    }
    if (this.existsAndIsInFuture(calculation.dates.ETD)) {
      const adjustment = await client.getPreviousWorkingDay(calculation.dates.ETD)
      if (adjustment.date !== calculation.dates.ETD) {
        adjustments.ETD = adjustment
      }
    }
    if (this.existsAndIsInFuture(calculation.dates.MTD)) {
      const adjustment = await client.getPreviousWorkingDay(calculation.dates.MTD)
      if (adjustment.date !== calculation.dates.MTD) {
        adjustments.MTD = adjustment
      }
    }
    if (this.existsAndIsInFuture(calculation.dates.LTD)) {
      const adjustment = await client.getPreviousWorkingDay(calculation.dates.LTD)
      if (adjustment.date !== calculation.dates.LTD) {
        adjustments.LTD = adjustment
      }
    }
    return adjustments
  }

  private existsAndIsInFuture(date: string): boolean {
    const now = dayjs()
    return date && now.isBefore(dayjs(date))
  }

  async getNonFridayReleaseAdjustments(
    calculation: BookingCalculation,
    token: string
  ): Promise<{ [key: string]: NonFridayReleaseDay }> {
    const client = new CalculateReleaseDatesApiClient(token)
    const adjustments: { [key: string]: NonFridayReleaseDay } = {}
    if (config.featureToggles.nonFridayRelease) {
      if (this.isNonFridayReleaseEligible(calculation.dates.CRD)) {
        const adjustment = await client.getNonReleaseFridayDay(calculation.dates.CRD)
        if (adjustment.date !== calculation.dates.CRD) {
          adjustments.CRD = adjustment
        }
      }
      if (this.isNonFridayReleaseEligible(calculation.dates.ARD)) {
        const adjustment = await client.getNonReleaseFridayDay(calculation.dates.ARD)
        if (adjustment.date !== calculation.dates.ARD) {
          adjustments.ARD = adjustment
        }
      }
      if (this.isNonFridayReleaseEligible(calculation.dates.PRRD)) {
        const adjustment = await client.getNonReleaseFridayDay(calculation.dates.PRRD)
        if (adjustment.date !== calculation.dates.PRRD) {
          adjustments.PRRD = adjustment
        }
      }
      if (this.isNonFridayReleaseEligible(calculation.dates.ETD)) {
        const adjustment = await client.getNonReleaseFridayDay(calculation.dates.ETD)
        if (adjustment.date !== calculation.dates.ETD) {
          adjustments.ETD = adjustment
        }
      }
      if (this.isNonFridayReleaseEligible(calculation.dates.MTD)) {
        const adjustment = await client.getNonReleaseFridayDay(calculation.dates.MTD)
        if (adjustment.date !== calculation.dates.MTD) {
          adjustments.MTD = adjustment
        }
      }
      if (this.isNonFridayReleaseEligible(calculation.dates.LTD)) {
        const adjustment = await client.getNonReleaseFridayDay(calculation.dates.LTD)
        if (adjustment.date !== calculation.dates.LTD) {
          adjustments.LTD = adjustment
        }
      }
    }
    return adjustments
  }

  private isNonFridayReleaseEligible(date: string): boolean {
    return this.existsAndIsInFuture(date) && config.featureToggles.nonFridayReleasePolicyStartDate.isBefore(dayjs(date))
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

  async getGenuineOverride(calculationReference: string, token: string): Promise<GenuineOverride> {
    return new CalculateReleaseDatesApiClient(token).getGenuineOverride(calculationReference)
  }
}

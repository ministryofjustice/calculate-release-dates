import dayjs from 'dayjs'
import { Request } from 'express'
import {
  Action,
  LatestCalculationCardConfig,
  LatestCalculationCardDate,
  LatestCalculationCardDateHint,
} from 'hmpps-court-cases-release-dates-design/hmpps/@types'
import CalculateReleaseDatesApiClient from '../api/calculateReleaseDatesApiClient'
import {
  AnalysedSentenceAndOffence,
  BookingCalculation,
  CalculationBreakdown,
  CalculationReason,
  CalculationRequestModel,
  CalculationUserInputs,
  GenuineOverrideRequest,
  HistoricCalculation,
  LatestCalculation,
  NomisCalculationSummary,
  ReleaseDateCalculationBreakdown,
  ReleaseDatesAndCalculationContext,
  SubmitCalculationRequest,
  ValidationMessage,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { ErrorMessages, ErrorMessageType } from '../types/ErrorMessages'
import logger from '../../logger'
import CalculationRule from '../enumerations/calculationRule'
import ReleaseDateWithAdjustments from '../@types/calculateReleaseDates/releaseDateWithAdjustments'
import { arithmeticToWords, daysArithmeticToWords, longDateFormat } from '../utils/utils'
import ReleaseDateType from '../enumerations/releaseDateType'
import {
  ResultsWithBreakdownAndAdjustments,
  RulesWithExtraAdjustments,
} from '../@types/calculateReleaseDates/rulesWithExtraAdjustments'
import ErrorMessage from '../types/ErrorMessage'
import { FullPageError } from '../types/FullPageError'
import { AnalyzedPrisonApiBookingAndSentenceAdjustments } from '../@types/prisonApi/prisonClientTypes'
import config from '../config'

export default class CalculateReleaseDatesService {
  // TODO test method - will be removed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
  async calculateReleaseDates(booking: any, token: string): Promise<BookingCalculation> {
    const bookingData = JSON.parse(booking)
    return new CalculateReleaseDatesApiClient(token).calculateReleaseDates(bookingData)
  }

  async calculatePreliminaryReleaseDates(
    prisonerId: string,
    calculationRequestModel: CalculationRequestModel,
    token: string,
  ): Promise<BookingCalculation> {
    return new CalculateReleaseDatesApiClient(token).calculatePreliminaryReleaseDates(
      prisonerId,
      calculationRequestModel,
    )
  }

  async getCalculationResults(calculationRequestId: number, token: string): Promise<BookingCalculation> {
    return new CalculateReleaseDatesApiClient(token).getCalculationResults(calculationRequestId)
  }

  async getCalculationResultsByReference(
    calculationReference: string,
    token: string,
    checkForChanges = false,
  ): Promise<BookingCalculation> {
    return new CalculateReleaseDatesApiClient(token).getCalculationResultsByReference(
      calculationReference,
      checkForChanges,
    )
  }

  async getUnsupportedSentenceOrCalculationMessages(prisonId: string, token: string): Promise<ValidationMessage[]> {
    const messages = await new CalculateReleaseDatesApiClient(token).getUnsupportedValidation(prisonId)
    if (messages.length) {
      return messages
    }
    const errors = await new CalculateReleaseDatesApiClient(token).validate(prisonId, {
      calculateErsed: false,
      sentenceCalculationUserInputs: [],
      useOffenceIndicators: false,
    })
    return errors.filter(it => it.type === ErrorMessageType.UNSUPPORTED_SDS40_SENTENCE)
  }

  async getBookingAndSentenceAdjustments(
    bookingId: number,
    token: string,
  ): Promise<AnalyzedPrisonApiBookingAndSentenceAdjustments> {
    return new CalculateReleaseDatesApiClient(token).getAnalyzedAdjustments(bookingId)
  }

  async getBreakdown(
    calculationRequestId: number,
    token: string,
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
    nomsId: string,
  ): Promise<CalculationRequestModel> {
    return {
      calculationUserInputs: userInputs,
      calculationReasonId: req.session.calculationReasonId[nomsId],
      otherReasonDescription: req.session.otherReasonDescription[nomsId],
    } as CalculationRequestModel
  }

  async getActiveAnalyzedSentencesAndOffences(bookingId: number, token: string): Promise<AnalysedSentenceAndOffence[]> {
    const sentencesAndOffences = await new CalculateReleaseDatesApiClient(token).getAnalyzedSentencesAndOffences(
      bookingId,
    )
    if (sentencesAndOffences.length === 0) {
      throw FullPageError.noSentences()
    }
    return sentencesAndOffences.filter((s: AnalysedSentenceAndOffence) => s.sentenceStatus === 'A')
  }

  private extractReleaseDatesWithAdjustments(breakdown: CalculationBreakdown): ReleaseDateWithAdjustments[] {
    const releaseDatesWithAdjustments: ReleaseDateWithAdjustments[] = []
    if (breakdown.breakdownByReleaseDateType.LED) {
      const ledDetails = breakdown.breakdownByReleaseDateType.LED
      releaseDatesWithAdjustments.push(
        this.ledRulesToAdjustmentRow(ledDetails.releaseDate, ledDetails.unadjustedDate, ledDetails.adjustedDays),
      )
    }
    if (breakdown.breakdownByReleaseDateType.SLED || breakdown.breakdownByReleaseDateType.SED) {
      CalculateReleaseDatesService.standardAdjustmentRow(
        breakdown.breakdownByReleaseDateType.SLED ? ReleaseDateType.SLED : ReleaseDateType.SED,
        breakdown.breakdownByReleaseDateType.SLED || breakdown.breakdownByReleaseDateType.SED,
        releaseDatesWithAdjustments,
      )
    }
    if (breakdown.breakdownByReleaseDateType.CRD || breakdown.breakdownByReleaseDateType.ARD) {
      CalculateReleaseDatesService.standardAdjustmentRow(
        breakdown.breakdownByReleaseDateType.CRD ? ReleaseDateType.CRD : ReleaseDateType.ARD,
        breakdown.breakdownByReleaseDateType.CRD || breakdown.breakdownByReleaseDateType.ARD,
        releaseDatesWithAdjustments,
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
          hdcedDetails.adjustedDays,
        ),
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
          tusedDetails.adjustedDays,
        ),
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
            ersedDetails.adjustedDays,
          ),
        )
      }
    }
    return releaseDatesWithAdjustments.filter(item => item)
  }

  private static standardAdjustmentRow(
    releaseDateType: ReleaseDateType,
    releaseDateCalculationBreakdown: ReleaseDateCalculationBreakdown,
    releaseDatesWithAdjustments: ReleaseDateWithAdjustments[],
  ) {
    releaseDatesWithAdjustments.push(
      CalculateReleaseDatesService.createAdjustmentRow(
        releaseDateCalculationBreakdown.releaseDate,
        releaseDateType,
        `${longDateFormat(releaseDateCalculationBreakdown.unadjustedDate)} ${daysArithmeticToWords(
          releaseDateCalculationBreakdown.adjustedDays,
        )}`,
      ),
    )
  }

  private hdcedRulesToAdjustmentRow(
    rules: string[],
    rulesWithExtraAdjustments: RulesWithExtraAdjustments,
    releaseDate: string,
    unadjustedDate: string,
    adjustedDays: number,
  ): ReleaseDateWithAdjustments {
    if (rules.includes(CalculationRule.HDCED_MINIMUM_CUSTODIAL_PERIOD)) {
      const ruleSpecificAdjustment = rulesWithExtraAdjustments.HDCED_MINIMUM_CUSTODIAL_PERIOD
      return CalculateReleaseDatesService.createAdjustmentRow(
        releaseDate,
        ReleaseDateType.HDCED,
        `${longDateFormat(unadjustedDate)} ${arithmeticToWords(ruleSpecificAdjustment)}`,
      )
    }

    if (rules.includes(CalculationRule.HDCED_GE_MIN_PERIOD_LT_MIDPOINT)) {
      const ruleSpecificAdjustment = rulesWithExtraAdjustments.HDCED_GE_MIN_PERIOD_LT_MIDPOINT
      return CalculateReleaseDatesService.createAdjustmentRow(
        releaseDate,
        ReleaseDateType.HDCED,
        `${longDateFormat(unadjustedDate)} ${arithmeticToWords(ruleSpecificAdjustment)} ${daysArithmeticToWords(
          adjustedDays,
        )}`,
      )
    }

    if (rules.includes(CalculationRule.HDCED_GE_MIDPOINT_LT_MAX_PERIOD)) {
      const ruleSpecificAdjustment = rulesWithExtraAdjustments.HDCED_GE_MIDPOINT_LT_MAX_PERIOD
      return CalculateReleaseDatesService.createAdjustmentRow(
        releaseDate,
        ReleaseDateType.HDCED,
        `${longDateFormat(unadjustedDate)} ${arithmeticToWords(ruleSpecificAdjustment)}`,
      )
    }
    return null
  }

  private ersedRulesToAdjustmentRow(
    rules: string[],
    rulesWithExtraAdjustments: RulesWithExtraAdjustments,
    releaseDate: string,
    unadjustedDate: string,
    adjustedDays: number,
  ): ReleaseDateWithAdjustments {
    if (rules.includes('ERSED_MAX_PERIOD')) {
      const ruleSpecificAdjustment = rulesWithExtraAdjustments.ERSED_MAX_PERIOD
      return CalculateReleaseDatesService.createAdjustmentRow(
        releaseDate,
        ReleaseDateType.ERSED,
        `${longDateFormat(unadjustedDate)} ${daysArithmeticToWords(adjustedDays)} ${arithmeticToWords(
          ruleSpecificAdjustment,
        )}`,
      )
    }
    return CalculateReleaseDatesService.createAdjustmentRow(
      releaseDate,
      ReleaseDateType.ERSED,
      `${longDateFormat(unadjustedDate)} ${daysArithmeticToWords(adjustedDays)}`,
    )
  }

  private tusedRulesToAdjustmentRow(
    rules: string[],
    rulesWithExtraAdjustments: RulesWithExtraAdjustments,
    releaseDate: string,
    unadjustedDate: string,
    adjustedDays: number,
  ): ReleaseDateWithAdjustments {
    if (rules.includes(CalculationRule.TUSED_LICENCE_PERIOD_LT_1Y)) {
      const ruleSpecificAdjustment = rulesWithExtraAdjustments[CalculationRule.TUSED_LICENCE_PERIOD_LT_1Y]
      return CalculateReleaseDatesService.createAdjustmentRow(
        releaseDate,
        ReleaseDateType.TUSED,
        `${longDateFormat(unadjustedDate)} ${arithmeticToWords(ruleSpecificAdjustment)} ${daysArithmeticToWords(
          adjustedDays,
        )}`,
      )
    }
    return null
  }

  private ledRulesToAdjustmentRow(
    releaseDate: string,
    unadjustedDate: string,
    adjustedDays: number,
  ): ReleaseDateWithAdjustments {
    return CalculateReleaseDatesService.createAdjustmentRow(
      releaseDate,
      ReleaseDateType.LED,
      `${longDateFormat(unadjustedDate)} ${daysArithmeticToWords(adjustedDays)}`,
    )
  }

  private static createAdjustmentRow(
    releaseDate: string,
    releaseDateType: ReleaseDateType,
    hintText: string,
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
    calculationRequestId: number,
    token: string,
    body: SubmitCalculationRequest,
  ): Promise<BookingCalculation> {
    return new CalculateReleaseDatesApiClient(token).confirmCalculation(calculationRequestId, body)
  }

  async getNextWorkingDay(date: string, token: string): Promise<string> {
    const client = new CalculateReleaseDatesApiClient(token)
    if (this.existsAndIsInFuture(date)) {
      const adjustment = await client.getNextWorkingDay(date)
      if (adjustment.date !== date) {
        return adjustment.date
      }
    }
    return null
  }

  private existsAndIsInFuture(date: string): boolean {
    const now = dayjs()
    return date && now.isBefore(dayjs(date))
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

  async getGenuineOverride(calculationReference: string, token: string): Promise<GenuineOverrideRequest> {
    return new CalculateReleaseDatesApiClient(token).getGenuineOverride(calculationReference)
  }

  async validateBookingForManualEntry(prisonerId: string, token: string): Promise<ErrorMessages> {
    const validationMessages = await new CalculateReleaseDatesApiClient(token).getBookingManualEntryValidation(
      prisonerId,
    )
    return validationMessages.length ? this.convertMessages(validationMessages) : { messages: [] }
  }

  async getCalculationHistory(prisonerId: string, token: string): Promise<HistoricCalculation[]> {
    return new CalculateReleaseDatesApiClient(token).getCalculationHistory(prisonerId)
  }

  async getResultsWithBreakdownAndAdjustments(
    calculationRequestId: number,
    token: string,
  ): Promise<ResultsWithBreakdownAndAdjustments> {
    return new CalculateReleaseDatesApiClient(token)
      .getDetailedCalculationResults(calculationRequestId)
      .then(results => {
        let withAdjustments: ResultsWithBreakdownAndAdjustments
        if (results.calculationBreakdown) {
          withAdjustments = {
            ...results,
            releaseDatesWithAdjustments: this.extractReleaseDatesWithAdjustments(results.calculationBreakdown),
          }
        } else {
          withAdjustments = {
            ...results,
            releaseDatesWithAdjustments: undefined,
          }
        }
        return withAdjustments
      })
  }

  async getLatestCalculationCardForPrisoner(
    prisonerId: string,
    token: string,
    hasIndeterminateSentence: boolean,
  ): Promise<{ latestCalcCard?: LatestCalculationCardConfig; latestCalcCardAction?: Action }> {
    const crdAPIClient = new CalculateReleaseDatesApiClient(token)
    return crdAPIClient
      .getLatestCalculationForPrisoner(prisonerId)
      .then(async latestCalc => {
        let action: Action
        const latestCalcCard = this.latestCalculationComponentConfig(latestCalc)
        if (latestCalc.calculationRequestId) {
          action = {
            title: 'View details',
            href: `/view/${prisonerId}/sentences-and-offences/${latestCalc.calculationRequestId}`,
            dataQa: 'latest-calc-card-action',
          }
          if (
            config.featureToggles.printNotificationSlipEnabled &&
            latestCalc.source === 'CRDS' &&
            !hasIndeterminateSentence
          ) {
            latestCalcCard.printNotificationSlip = {
              href: `/view/${prisonerId}/calculation-summary/${latestCalc.calculationRequestId}/printNotificationSlip?fromPage=view`,
              dataQa: 'release-notification-hook',
            }
          }
        }
        return {
          latestCalcCard,
          latestCalcCardAction: action,
        }
      })
      .catch(error => {
        logger.info(`Unable to load latest calc ${error}`)
        return { latestCalcCard: undefined, latestCalcCardAction: undefined }
      })
  }

  private latestCalculationComponentConfig(latestCalculation: LatestCalculation): LatestCalculationCardConfig {
    const dates: LatestCalculationCardDate[] = Object.values(latestCalculation.dates).map(date => {
      const cardDate: LatestCalculationCardDate = {
        type: date.type,
        description: date.description,
        date: date.date,
        hints: date.hints.map(hint => {
          const cardHint: LatestCalculationCardDateHint = {
            text: hint.text,
            href: hint.link,
          }
          return cardHint
        }),
      }
      return cardDate
    })
    return {
      source: latestCalculation.source,
      calculatedAt: latestCalculation.calculatedAt,
      establishment: latestCalculation.establishment,
      reason: latestCalculation.reason,
      dates,
    }
  }

  async getNomisCalculationSummary(offenderSentCalcId: number, token: string): Promise<NomisCalculationSummary> {
    return new CalculateReleaseDatesApiClient(token).getNomisCalculationSummary(offenderSentCalcId)
  }

  async getReleaseDatesForACalcReqId(calcRequestId: number, token: string): Promise<ReleaseDatesAndCalculationContext> {
    return new CalculateReleaseDatesApiClient(token).getReleaseDatesForACalcReqId(calcRequestId)
  }

  async hasIndeterminateSentences(bookingId: number, token: string): Promise<boolean> {
    return new CalculateReleaseDatesApiClient(token).hasIndeterminateSentences(bookingId)
  }
}

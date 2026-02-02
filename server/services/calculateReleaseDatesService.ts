import dayjs from 'dayjs'
import { Request } from 'express'
import {
  Action,
  LatestCalculationCardConfig,
  LatestCalculationCardDate,
  LatestCalculationCardDateHint,
} from '@ministryofjustice/hmpps-court-cases-release-dates-design/hmpps/@types'
import CalculateReleaseDatesApiClient from '../data/calculateReleaseDatesApiClient'
import {
  Agency,
  AgencySwitchUpdateResult,
  AnalysedAdjustment,
  AnalysedSentenceAndOffence,
  ApprovedDatesInputResponse,
  BookingCalculation,
  CalculationBreakdown,
  CalculationReason,
  CalculationRequestModel,
  CalculationUserInputs,
  DateTypeDefinition,
  GenuineOverrideCreatedResponse,
  GenuineOverrideInputResponse,
  GenuineOverrideReason,
  GenuineOverrideRequest,
  HistoricCalculation,
  LatestCalculation,
  NomisCalculationSummary,
  ReleaseDateCalculationBreakdown,
  ReleaseDatesAndCalculationContext,
  SubmitCalculationRequest,
  SupportedValidationResponse,
  ValidationMessage,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { ErrorMessages } from '../types/ErrorMessages'
import logger from '../../logger'
import CalculationRule from '../enumerations/calculationRule'
import ReleaseDateWithAdjustments from '../@types/calculateReleaseDates/releaseDateWithAdjustments'
import {
  arithmeticToWords,
  convertValidationToErrorMessages,
  daysArithmeticToWords,
  longDateFormat,
} from '../utils/utils'
import ReleaseDateType from '../enumerations/releaseDateType'
import {
  ResultsWithBreakdownAndAdjustments,
  RulesWithExtraAdjustments,
} from '../@types/calculateReleaseDates/rulesWithExtraAdjustments'
import { FullPageError } from '../types/FullPageError'
import { AnalysedPrisonApiBookingAndSentenceAdjustments } from '../@types/prisonApi/prisonClientTypes'
import ComparisonResultMismatchDetailJsonModel from '../models/ComparisonResultMismatchDetailJsonModel'
import AuditService from './auditService'
import { CalculationCard } from '../types/CalculationCard'
import CalculateReleaseDatesApiRestClient from '../data/calculateReleaseDatesApiRestClient'

export default class CalculateReleaseDatesService {
  constructor(
    private readonly auditService: AuditService,
    private readonly calculateReleaseDatesApiRestClient: CalculateReleaseDatesApiRestClient,
  ) {}

  async calculatePreliminaryReleaseDates(
    prisonerId: string,
    calculationRequestModel: CalculationRequestModel,
    username: string,
  ): Promise<BookingCalculation> {
    return this.calculateReleaseDatesApiRestClient.calculatePreliminaryReleaseDates(
      prisonerId,
      calculationRequestModel,
      username,
    )
  }

  async getCalculationResults(calculationRequestId: number, username: string): Promise<BookingCalculation> {
    return this.calculateReleaseDatesApiRestClient.getCalculationResults(calculationRequestId, username)
  }

  async getUnsupportedSentenceOrCalculationMessages(prisonId: string, username: string): Promise<ValidationMessage[]> {
    const validationMessages = await this.calculateReleaseDatesApiRestClient.getUnsupportedSentenceValidation(
      prisonId,
      username,
    )

    const combinedMessages: ValidationMessage[] = []
    if (validationMessages.unsupportedSentenceMessages)
      combinedMessages.push(...validationMessages.unsupportedSentenceMessages.values())
    if (validationMessages.unsupportedCalculationMessages)
      combinedMessages.push(...validationMessages.unsupportedCalculationMessages.values())
    if (validationMessages.unsupportedManualMessages)
      combinedMessages.push(...validationMessages.unsupportedManualMessages.values())
    return combinedMessages
  }

  async getUnsupportedSentenceOrCalculationMessagesWithType(
    prisonId: string,
    username: string,
  ): Promise<SupportedValidationResponse> {
    return this.calculateReleaseDatesApiRestClient.getUnsupportedSentenceValidation(prisonId, username)
  }

  async getBookingAndSentenceAdjustments(
    bookingId: number,
    username: string,
  ): Promise<AnalysedPrisonApiBookingAndSentenceAdjustments> {
    return this.calculateReleaseDatesApiRestClient.getAnalysedAdjustments(bookingId, username)
  }

  async getAdjustmentsForPrisoner(prisonerId: string, username: string): Promise<AnalysedAdjustment[]> {
    return this.calculateReleaseDatesApiRestClient.getAdjustmentsForPrisoner(prisonerId, username)
  }

  async getBreakdown(
    calculationRequestId: number,
    username: string,
  ): Promise<{
    calculationBreakdown?: CalculationBreakdown
    releaseDatesWithAdjustments: ReleaseDateWithAdjustments[]
  }> {
    try {
      const breakdown = await this.getCalculationBreakdown(calculationRequestId, username)
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

  getCalculationRequestModel(req: Request, userInputs: CalculationUserInputs, nomsId: string): CalculationRequestModel {
    return {
      calculationUserInputs: userInputs,
      calculationReasonId: req.session.calculationReasonId[nomsId],
      otherReasonDescription: req.session.otherReasonDescription[nomsId],
    } as CalculationRequestModel
  }

  async getActiveAnalysedSentencesAndOffences(
    bookingId: number,
    username: string,
  ): Promise<AnalysedSentenceAndOffence[]> {
    const sentencesAndOffences = await this.calculateReleaseDatesApiRestClient.getAnalysedSentencesAndOffences(
      bookingId,
      username,
    )
    if (sentencesAndOffences.length === 0) {
      throw FullPageError.noSentences(bookingId)
    }
    return sentencesAndOffences.filter((s: AnalysedSentenceAndOffence) => s.sentenceStatus === 'A')
  }

  async getErsedEligibility(bookingId: number, username: string) {
    return this.calculateReleaseDatesApiRestClient.getErsedEligibility(bookingId, username)
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

  public async getCalculationBreakdown(calculationRequestId: number, username: string): Promise<CalculationBreakdown> {
    return this.calculateReleaseDatesApiRestClient.getCalculationBreakdown(calculationRequestId, username)
  }

  public async getCalculationReasons(username: string): Promise<CalculationReason[]> {
    return this.calculateReleaseDatesApiRestClient.getCalculationReasons(username)
  }

  public async getGenuineOverrideReasons(username: string): Promise<GenuineOverrideReason[]> {
    return this.calculateReleaseDatesApiRestClient.getGenuineOverrideReasons(username)
  }

  async confirmCalculation(
    userName: string,
    nomsId: string,
    calculationRequestId: number,
    token: string,
    body: SubmitCalculationRequest,
  ): Promise<BookingCalculation> {
    try {
      const calculation = await new CalculateReleaseDatesApiClient(token).confirmCalculation(calculationRequestId, body)
      await this.auditService.publishSentenceCalculation(
        userName,
        calculation.prisonerId,
        nomsId,
        calculation.calculationReference,
      )
      return calculation
    } catch (error) {
      await this.auditService.publishSentenceCalculationFailure(userName, nomsId, error)
      throw error
    }
  }

  async createGenuineOverrideForCalculation(
    userName: string,
    nomsId: string,
    calculationRequestId: number,
    token: string,
    body: GenuineOverrideRequest,
  ): Promise<GenuineOverrideCreatedResponse> {
    try {
      const genuineOverrideResponse = await new CalculateReleaseDatesApiClient(token)
        .createGenuineOverrideForCalculation(calculationRequestId, body)
        .catch(error => {
          if (error.status === 400) {
            logger.info(`Received 400 on creating genuine override. Date selection was invalid.`)
            return error.data
          }
          throw error
        })
      if (genuineOverrideResponse.success) {
        await this.auditService.publishGenuineOverride(
          userName,
          nomsId,
          genuineOverrideResponse.originalCalculationRequestId,
          genuineOverrideResponse.newCalculationRequestId,
        )
      }
      return genuineOverrideResponse
    } catch (error) {
      await this.auditService.publishGenuineOverrideFailed(userName, nomsId, calculationRequestId, error)
      throw error
    }
  }

  async getNextWorkingDay(date: string, username: string): Promise<string> {
    if (this.existsAndIsInFuture(date)) {
      const adjustment = await this.calculateReleaseDatesApiRestClient.getNextWorkingDay(date, username)
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

  async validateBackend(
    prisonId: string,
    userInput: CalculationUserInputs,
    username: string,
  ): Promise<ValidationMessage[]> {
    return this.calculateReleaseDatesApiRestClient.validate(prisonId, userInput, username)
  }

  async validateDatesForManualEntry(username: string, dateTypes: string[]): Promise<ErrorMessages> {
    const validationMessages = await this.calculateReleaseDatesApiRestClient.getManualEntryDateValidation(
      dateTypes,
      username,
    )
    return validationMessages.length ? convertValidationToErrorMessages(validationMessages) : { messages: [] }
  }

  async validateDatesForGenuineOverride(username: string, dateTypes: string[]): Promise<ValidationMessage[]> {
    return this.calculateReleaseDatesApiRestClient.getManualEntryDateValidation(dateTypes, username)
  }

  async validateBookingForManualEntry(prisonerId: string, username: string): Promise<ErrorMessages> {
    const validationMessages = await this.calculateReleaseDatesApiRestClient.getBookingManualEntryValidation(
      prisonerId,
      username,
    )
    return validationMessages.length ? convertValidationToErrorMessages(validationMessages) : { messages: [] }
  }

  async offenderHasPreviousManualCalculation(prisonerId: string, username: string): Promise<boolean> {
    return this.calculateReleaseDatesApiRestClient.hasExistingManualCalculation(prisonerId, username)
  }

  async getCalculationHistory(prisonerId: string, username: string): Promise<HistoricCalculation[]> {
    return this.calculateReleaseDatesApiRestClient.getCalculationHistory(prisonerId, username)
  }

  async getResultsWithBreakdownAndAdjustments(
    calculationRequestId: number,
    username: string,
  ): Promise<ResultsWithBreakdownAndAdjustments> {
    return this.calculateReleaseDatesApiRestClient
      .getDetailedCalculationResults(calculationRequestId, username)
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

  async getLatestCalculationForPrisoner(prisonerId: string, username: string): Promise<LatestCalculation> {
    return this.calculateReleaseDatesApiRestClient.getLatestCalculationForPrisoner(prisonerId, username)
  }

  async getLatestCalculationCardForPrisoner(
    prisonerId: string,
    username: string,
    hasIndeterminateSentence: boolean,
  ): Promise<CalculationCard | FullPageError> {
    return this.calculateReleaseDatesApiRestClient
      .getLatestCalculationForPrisoner(prisonerId, username)
      .then(async latestCalc => {
        let action: Action
        const latestCalcCard = this.latestCalculationComponentConfig(latestCalc)
        if (latestCalc.calculationRequestId) {
          action = {
            title: 'View details',
            href: `/view/${prisonerId}/sentences-and-offences/${latestCalc.calculationRequestId}`,
            dataQa: 'latest-calc-card-action',
          }
          if (latestCalc.source === 'CRDS' && !hasIndeterminateSentence) {
            latestCalcCard.printNotificationSlip = {
              href: `/view/${prisonerId}/calculation-summary/${latestCalc.calculationRequestId}/printNotificationSlip?fromPage=view`,
              dataQa: 'release-notification-hook',
            }
          }
        }
        return {
          latestCalcCard,
          latestCalcCardAction: action,
          calculation: latestCalc,
        }
      })
      .catch(error => {
        return { latestCalcCard: undefined, latestCalcCardAction: undefined, calculation: undefined }
      })
  }

  public async getPrisonJsonMismatchComparison(
    username: string,
    comparisonReference: string,
    mismatchReference: string,
  ): Promise<ComparisonResultMismatchDetailJsonModel> {
    const data = await this.calculateReleaseDatesApiRestClient.getPrisonJsonMismatchComparison(
      comparisonReference,
      mismatchReference,
      username,
    )
    return new ComparisonResultMismatchDetailJsonModel(data.inputData, data.sentenceAndOffences, data.adjustments)
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

  async getNomisCalculationSummary(offenderSentCalcId: number, username: string): Promise<NomisCalculationSummary> {
    return this.calculateReleaseDatesApiRestClient.getNomisCalculationSummary(offenderSentCalcId, username)
  }

  async getReleaseDatesForACalcReqId(
    calcRequestId: number,
    username: string,
  ): Promise<ReleaseDatesAndCalculationContext> {
    return this.calculateReleaseDatesApiRestClient.getReleaseDatesForACalcReqId(calcRequestId, username)
  }

  async hasIndeterminateSentences(bookingId: number, username: string): Promise<boolean> {
    return this.calculateReleaseDatesApiRestClient.hasIndeterminateSentences(bookingId, username)
  }

  async getGenuineOverrideInputs(
    calculationRequestId: number,
    username: string,
  ): Promise<GenuineOverrideInputResponse> {
    return this.calculateReleaseDatesApiRestClient.getGenuineOverrideInputs(calculationRequestId, username)
  }

  async getApprovedDatesInputs(prisonerId: string, username: string): Promise<ApprovedDatesInputResponse> {
    return this.calculateReleaseDatesApiRestClient.getApprovedDatesInputs(prisonerId, username)
  }

  async getDateTypeDefinitions(username: string): Promise<DateTypeDefinition[]> {
    return this.calculateReleaseDatesApiRestClient.getDateTypeDefinitions(username)
  }

  async getDisabledNomisAgencies(username: string): Promise<Agency[]> {
    return this.calculateReleaseDatesApiRestClient.getDisabledNomisAgencies(username)
  }

  async updateDisabledNomisAgencies(username: string): Promise<AgencySwitchUpdateResult> {
    return this.calculateReleaseDatesApiRestClient.updateDisabledNomisAgencies(username)
  }
}

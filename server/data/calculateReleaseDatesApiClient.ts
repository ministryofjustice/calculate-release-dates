import config, { ApiConfig } from '../config'
import RestClient from './restClient'
import {
  Agency,
  AgencySwitchUpdateResult,
  AnalysedAdjustment,
  AnalysedSentenceAndOffence,
  ApprovedDatesInputResponse,
  BookingCalculation,
  CalculationUserInputs,
  DateTypeDefinition,
  DetailedCalculationResults,
  ErsedEligibility,
  GenuineOverrideCreatedResponse,
  GenuineOverrideInputResponse,
  GenuineOverrideRequest,
  HistoricCalculation,
  LatestCalculation,
  ManualEntryRequest,
  NomisCalculationSummary,
  ReleaseDatesAndCalculationContext,
  SubmitCalculationRequest,
  ValidationMessage,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { AnalysedPrisonApiBookingAndSentenceAdjustments } from '../@types/prisonApi/prisonClientTypes'
import ManualCalculationResponse from '../models/manual_calculation/ManualCalculationResponse'

export default class CalculateReleaseDatesApiClient {
  restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient(
      'Calculate release dates API',
      config.apis.calculateReleaseDates as ApiConfig,
      token,
    )
  }

  confirmCalculation(calculationRequestId: number, body: SubmitCalculationRequest): Promise<BookingCalculation> {
    return this.restClient.post({
      path: `/calculation/confirm/${calculationRequestId}`,
      data: body,
    }) as Promise<BookingCalculation>
  }

  createGenuineOverrideForCalculation(
    calculationRequestId: number,
    body: GenuineOverrideRequest,
  ): Promise<GenuineOverrideCreatedResponse> {
    return this.restClient.post({
      path: `/genuine-override/calculation/${calculationRequestId}`,
      data: body,
    }) as Promise<GenuineOverrideCreatedResponse>
  }

  validate(prisonerId: string, userInput: CalculationUserInputs): Promise<ValidationMessage[]> {
    return this.restClient.post({
      path: `/validation/${prisonerId}/full-validation`,
      data: userInput || null,
    }) as Promise<ValidationMessage[]>
  }

  storeManualCalculation(nomsId: string, manualEntryRequest: ManualEntryRequest) {
    return this.restClient.post({
      path: `/manual-calculation/${nomsId}`,
      data: manualEntryRequest,
    }) as Promise<ManualCalculationResponse>
  }

  getAnalysedSentencesAndOffences(bookingId: number): Promise<AnalysedSentenceAndOffence[]> {
    return this.restClient.get({
      path: `/sentence-and-offence-information/${bookingId}`,
    }) as Promise<AnalysedSentenceAndOffence[]>
  }

  getAnalysedAdjustments(bookingId: number): Promise<AnalysedPrisonApiBookingAndSentenceAdjustments> {
    return this.restClient.get({
      path: `/booking-and-sentence-adjustments/${bookingId}`,
    }) as Promise<AnalysedPrisonApiBookingAndSentenceAdjustments>
  }

  getAdjustmentsForPrisoner(prisonerId: string): Promise<AnalysedAdjustment[]> {
    return this.restClient.get({
      path: `/adjustments/${prisonerId}`,
    }) as Promise<AnalysedAdjustment[]>
  }

  getBookingManualEntryValidation(prisonerId: string) {
    return this.restClient.get({
      path: `/validation/${prisonerId}/manual-entry-validation`,
    }) as Promise<ValidationMessage[]>
  }

  getManualEntryDateValidation(dateTypes: string[]) {
    return this.restClient.get({
      path: `/validation/manual-entry-dates-validation?releaseDates=${dateTypes.join(',')}`,
    }) as Promise<ValidationMessage[]>
  }

  getCalculationHistory(prisonerId: string): Promise<HistoricCalculation[]> {
    return this.restClient.get({
      path: `/historicCalculations/${prisonerId}`,
    }) as Promise<HistoricCalculation[]>
  }

  getDetailedCalculationResults(calculationRequestId: number): Promise<DetailedCalculationResults> {
    return this.restClient.get({
      path: `/calculation/detailed-results/${calculationRequestId}`,
    }) as Promise<DetailedCalculationResults>
  }

  getLatestCalculationForPrisoner(prisonerId: string): Promise<LatestCalculation> {
    return this.restClient.get({
      path: `/calculation/${prisonerId}/latest`,
    }) as Promise<LatestCalculation>
  }

  async getDateTypeDefinitions() {
    return this.restClient.get({
      path: '/reference-data/date-type',
    }) as Promise<DateTypeDefinition[]>
  }

  getNomisCalculationSummary(offenderSentCalcId: number): Promise<NomisCalculationSummary> {
    return this.restClient.get({
      path: `/calculation/nomis-calculation-summary/${offenderSentCalcId}`,
    }) as Promise<NomisCalculationSummary>
  }

  getReleaseDatesForACalcReqId(calcReqId: number): Promise<ReleaseDatesAndCalculationContext> {
    return this.restClient.get({
      path: `/calculation/release-dates/${calcReqId}`,
    }) as Promise<ReleaseDatesAndCalculationContext>
  }

  hasRecallSentences(bookingId: number): Promise<boolean> {
    return this.restClient.get({
      path: `/manual-calculation/${bookingId}/has-recall-sentences`,
    }) as Promise<boolean>
  }

  getErsedEligibility(bookingId: number) {
    return this.restClient.get({
      path: `/eligibility/${bookingId}/ersed`,
    }) as Promise<ErsedEligibility>
  }

  hasExistingManualCalculation(prisonerId: string) {
    return this.restClient.get({
      path: `/manual-calculation/${prisonerId}/has-existing-calculation`,
    }) as Promise<boolean>
  }

  getGenuineOverrideInputs(calculationRequestId: number): Promise<GenuineOverrideInputResponse> {
    return this.restClient.get({
      path: `/genuine-override/calculation/${calculationRequestId}/inputs`,
    }) as Promise<GenuineOverrideInputResponse>
  }

  getApprovedDatesInputs(prisonerId: string): Promise<ApprovedDatesInputResponse> {
    return this.restClient.get({
      path: `/approved-dates/${prisonerId}/inputs`,
    }) as Promise<ApprovedDatesInputResponse>
  }

  getDisabledNomisAgencies(): Promise<Agency[]> {
    return this.restClient.get({
      path: `/feature-toggle/nomis-calc-disabled`,
    }) as Promise<Agency[]>
  }

  updateDisabledNomisAgencies(): Promise<AgencySwitchUpdateResult> {
    return this.restClient.post({
      path: `/feature-toggle/nomis-calc-disabled`,
    }) as Promise<AgencySwitchUpdateResult>
  }
}

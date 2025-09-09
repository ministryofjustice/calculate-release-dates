import config, { ApiConfig } from '../config'
import RestClient from '../data/restClient'
import {
  AnalysedSentenceAndOffence,
  BookingCalculation,
  CalculationBreakdown,
  CalculationReason,
  CalculationRequestModel,
  CalculationUserInputs,
  Comparison,
  ComparisonOverview,
  ComparisonPersonDiscrepancyRequest,
  ComparisonPersonDiscrepancySummary,
  ComparisonPersonJson,
  ComparisonPersonOverview,
  ComparisonSummary,
  DateTypeDefinition,
  DetailedCalculationResults,
  ErsedEligibility,
  HistoricCalculation,
  LatestCalculation,
  ManualEntryRequest,
  NomisCalculationSummary,
  ReleaseDatesAndCalculationContext,
  SentenceAndOffenceWithReleaseArrangements,
  SubmitCalculationRequest,
  SupportedValidationResponse,
  ValidationMessage,
  WorkingDay,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import {
  AnalysedPrisonApiBookingAndSentenceAdjustments,
  PrisonApiPrisoner,
  PrisonApiReturnToCustodyDate,
} from '../@types/prisonApi/prisonClientTypes'
import ManualCalculationResponse from '../models/manual_calculation/ManualCalculationResponse'
import ComparisonType from '../enumerations/comparisonType'

export default class CalculateReleaseDatesApiClient {
  restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient(
      'Calculate release dates API',
      config.apis.calculateReleaseDates as ApiConfig,
      token,
    )
  }

  // TODO test method - will be removed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  calculateReleaseDates(booking: any): Promise<BookingCalculation> {
    return this.restClient.post({ path: '/test/calculation-by-booking', data: booking }) as Promise<BookingCalculation>
  }

  calculatePreliminaryReleaseDates(
    prisonerId: string,
    calculationRequestModel: CalculationRequestModel,
  ): Promise<BookingCalculation> {
    return this.restClient.post({
      path: `/calculation/${prisonerId}`,
      data: calculationRequestModel || null,
    }) as Promise<BookingCalculation>
  }

  getCalculationResults(calculationRequestId: number): Promise<BookingCalculation> {
    return this.restClient.get({
      path: `/calculation/results/${calculationRequestId}`,
    }) as Promise<BookingCalculation>
  }

  getCalculationResultsByReference(
    calculationReference: string,
    checkForChanges: boolean,
  ): Promise<BookingCalculation> {
    let url = `/calculationReference/${calculationReference}`
    if (checkForChanges) {
      url += `?checkForChange=${checkForChanges}`
    }
    return this.restClient.get({
      path: url,
    }) as Promise<BookingCalculation>
  }

  getCalculationBreakdown(calculationRequestId: number): Promise<CalculationBreakdown> {
    return this.restClient.get({
      path: `/calculation/breakdown/${calculationRequestId}`,
    }) as Promise<CalculationBreakdown>
  }

  confirmCalculation(calculationRequestId: number, body: SubmitCalculationRequest): Promise<BookingCalculation> {
    return this.restClient.post({
      path: `/calculation/confirm/${calculationRequestId}`,
      data: body,
    }) as Promise<BookingCalculation>
  }

  getNextWorkingDay(date: string): Promise<WorkingDay> {
    return this.restClient.get({ path: `/working-day/next/${date}` }) as Promise<WorkingDay>
  }

  getCalculationReasons(): Promise<CalculationReason[]> {
    return this.restClient.get({ path: `/calculation-reasons/` }) as Promise<CalculationReason[]>
  }

  validate(prisonerId: string, userInput: CalculationUserInputs): Promise<ValidationMessage[]> {
    return this.restClient.post({
      path: `/validation/${prisonerId}/full-validation`,
      data: userInput || null,
    }) as Promise<ValidationMessage[]>
  }

  getPrisonerDetail(calculationId: number): Promise<PrisonApiPrisoner> {
    return this.restClient.get({ path: `/calculation/prisoner-details/${calculationId}` }) as Promise<PrisonApiPrisoner>
  }

  getSentencesAndOffences(calculationId: number): Promise<SentenceAndOffenceWithReleaseArrangements[]> {
    return this.restClient.get({
      path: `/calculation/sentence-and-offences/${calculationId}`,
    }) as Promise<SentenceAndOffenceWithReleaseArrangements[]>
  }

  getReturnToCustodyDate(calculationId: number): Promise<PrisonApiReturnToCustodyDate> {
    return this.restClient.get({
      path: `/calculation/return-to-custody/${calculationId}`,
    }) as Promise<PrisonApiReturnToCustodyDate>
  }

  getBookingAndSentenceAdjustments(calculationId: number): Promise<AnalysedPrisonApiBookingAndSentenceAdjustments> {
    return this.restClient.get({
      path: `/calculation/adjustments/${calculationId}`,
    }) as Promise<AnalysedPrisonApiBookingAndSentenceAdjustments>
  }

  getLatestCalculation(prisonerId: string, bookingId: number): Promise<BookingCalculation> {
    return this.restClient.get({
      path: `/calculation/results/${prisonerId}/${bookingId}`,
    }) as Promise<BookingCalculation>
  }

  getCalculationUserInputs(calculationId: number): Promise<CalculationUserInputs> {
    return this.restClient.get({
      path: `/calculation/calculation-user-input/${calculationId}`,
    }) as Promise<CalculationUserInputs>
  }

  getUnsupportedCalculationValidation(prisonerId: string): Promise<ValidationMessage[]> {
    return this.restClient.get({
      path: `/validation/${prisonerId}/unsupported-calculation`,
    }) as Promise<ValidationMessage[]>
  }

  getUnsupportedSentenceValidation(prisonerId: string): Promise<SupportedValidationResponse> {
    return this.restClient.get({
      path: `/validation/${prisonerId}/supported-validation`,
    }) as Promise<SupportedValidationResponse>
  }

  hasIndeterminateSentences(bookingId: number): Promise<boolean> {
    return this.restClient.get({
      path: `/manual-calculation/${bookingId}/has-indeterminate-sentences`,
    }) as Promise<boolean>
  }

  storeManualCalculation(nomsId: string, manualEntryRequest: ManualEntryRequest) {
    return this.restClient.post({
      path: `/manual-calculation/${nomsId}`,
      data: manualEntryRequest,
    }) as Promise<ManualCalculationResponse>
  }

  createPrisonComparison(prison: string, comparisonType: ComparisonType): Promise<Comparison> {
    return this.restClient.post({
      path: '/comparison',
      data: { criteria: {}, prison, comparisonType },
    }) as Promise<Comparison>
  }

  getPrisonComparison(comparisonReference: string): Promise<ComparisonOverview> {
    return this.restClient.get({ path: `/comparison/${comparisonReference}` }) as Promise<ComparisonOverview>
  }

  getPrisonComparisons(): Promise<ComparisonSummary[]> {
    return this.restClient.get({ path: '/comparison' }) as Promise<ComparisonSummary[]>
  }

  getManualComparisons(): Promise<ComparisonSummary[]> {
    return this.restClient.get({ path: '/comparison/manual' }) as Promise<ComparisonSummary[]>
  }

  createManualComparison(prisonerIds: string[]): Promise<Comparison> {
    return this.restClient.post({
      path: '/comparison/manual',
      data: { prisonerIds },
    }) as Promise<Comparison>
  }

  getManualComparison(comparisonReference: string): Promise<ComparisonOverview> {
    return this.restClient.get({ path: `/comparison/manual/${comparisonReference}` }) as Promise<ComparisonOverview>
  }

  getPrisonMismatchComparison(
    comparisonReference: string,
    mismatchReference: string,
  ): Promise<ComparisonPersonOverview> {
    return this.restClient.get({
      path: `/comparison/${comparisonReference}/mismatch/${mismatchReference}`,
    }) as Promise<ComparisonPersonOverview>
  }

  getPrisonJsonMismatchComparison(
    comparisonReference: string,
    mismatchReference: string,
  ): Promise<ComparisonPersonJson> {
    return this.restClient.get({
      path: `/comparison/${comparisonReference}/mismatch/${mismatchReference}/json`,
    }) as Promise<ComparisonPersonJson>
  }

  getMismatchDiscrepancy(
    comparisonReference: string,
    mismatchReference: string,
  ): Promise<ComparisonPersonDiscrepancySummary> {
    return this.restClient.get({
      path: `/comparison/${comparisonReference}/mismatch/${mismatchReference}/discrepancy`,
    }) as Promise<ComparisonPersonDiscrepancySummary>
  }

  getManualMismatchDiscrepancy(
    comparisonReference: string,
    mismatchReference: string,
  ): Promise<ComparisonPersonDiscrepancySummary> {
    return this.restClient.get({
      path: `/comparison/manual/${comparisonReference}/mismatch/${mismatchReference}/discrepancy`,
    }) as Promise<ComparisonPersonDiscrepancySummary>
  }

  createMismatchDiscrepancy(
    comparisonReference: string,
    mismatchReference: string,
    discrepancy: ComparisonPersonDiscrepancyRequest,
  ): Promise<ComparisonPersonDiscrepancySummary> {
    return this.restClient.post({
      path: `/comparison/${comparisonReference}/mismatch/${mismatchReference}/discrepancy`,
      data: discrepancy,
    }) as Promise<ComparisonPersonDiscrepancySummary>
  }

  createManualMismatchDiscrepancy(
    comparisonReference: string,
    mismatchReference: string,
    discrepancy: ComparisonPersonDiscrepancyRequest,
  ): Promise<ComparisonPersonDiscrepancySummary> {
    return this.restClient.post({
      path: `/comparison/manual/${comparisonReference}/mismatch/${mismatchReference}/discrepancy`,
      data: discrepancy,
    }) as Promise<ComparisonPersonDiscrepancySummary>
  }

  getManualMismatchComparison(
    comparisonReference: string,
    mismatchReference: string,
  ): Promise<ComparisonPersonOverview> {
    return this.restClient.get({
      path: `/comparison/manual/${comparisonReference}/mismatch/${mismatchReference}`,
    }) as Promise<ComparisonPersonOverview>
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

  getNomisCalculationSummary(offenderSentCalcId: number, bookingId: number): Promise<NomisCalculationSummary> {
    return this.restClient.get({
      path: `/calculation/nomis-calculation-summary/booking/${bookingId}/calculation/${offenderSentCalcId}`,
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
}

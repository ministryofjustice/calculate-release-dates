import config, { ApiConfig } from '../config'
import RestClient from '../data/restClient'
import {
  AnalyzedSentenceAndOffences,
  BookingCalculation,
  CalculationBreakdown,
  CalculationReason,
  CalculationRequestModel,
  CalculationResults,
  CalculationUserInputs,
  CalculationUserQuestions,
  Comparison,
  ComparisonOverview,
  ComparisonPersonDiscrepancyRequest,
  ComparisonPersonDiscrepancySummary,
  ComparisonPersonOverview,
  ComparisonSummary,
  GenuineOverrideRequest,
  GenuineOverrideDateRequest,
  GenuineOverrideDateResponse,
  ManualEntryRequest,
  NonFridayReleaseDay,
  SubmitCalculationRequest,
  ValidationMessage,
  WorkingDay,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import {
  AnalyzedPrisonApiBookingAndSentenceAdjustments,
  PrisonApiOffenderSentenceAndOffences,
  PrisonApiPrisoner,
  PrisonApiReturnToCustodyDate,
} from '../@types/prisonApi/prisonClientTypes'
import ManualCalculationResponse from '../models/ManualCalculationResponse'
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
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

  calculateTestReleaseDates(
    prisonerId: string,
    calculationRequestModel: CalculationRequestModel,
  ): Promise<CalculationResults> {
    return this.restClient.post({
      path: `/calculation/${prisonerId}/test`,
      data: calculationRequestModel,
    }) as Promise<CalculationResults>
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

  getPreviousWorkingDay(date: string): Promise<WorkingDay> {
    return this.restClient.get({ path: `/working-day/previous/${date}` }) as Promise<WorkingDay>
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

  getSentencesAndOffences(calculationId: number): Promise<PrisonApiOffenderSentenceAndOffences[]> {
    return this.restClient.get({
      path: `/calculation/sentence-and-offences/${calculationId}`,
    }) as Promise<PrisonApiOffenderSentenceAndOffences[]>
  }

  getReturnToCustodyDate(calculationId: number): Promise<PrisonApiReturnToCustodyDate> {
    return this.restClient.get({
      path: `/calculation/return-to-custody/${calculationId}`,
    }) as Promise<PrisonApiReturnToCustodyDate>
  }

  getBookingAndSentenceAdjustments(calculationId: number): Promise<AnalyzedPrisonApiBookingAndSentenceAdjustments> {
    return this.restClient.get({
      path: `/calculation/adjustments/${calculationId}`,
    }) as Promise<AnalyzedPrisonApiBookingAndSentenceAdjustments>
  }

  getLatestCalculation(prisonerId: string, bookingId: number): Promise<BookingCalculation> {
    return this.restClient.get({
      path: `/calculation/results/${prisonerId}/${bookingId}`,
    }) as Promise<BookingCalculation>
  }

  getCalculationUserQuestions(prisonerId: string): Promise<CalculationUserQuestions> {
    return this.restClient.get({
      path: `/calculation/${prisonerId}/user-questions`,
    }) as Promise<CalculationUserQuestions>
  }

  getCalculationUserInputs(calculationId: number): Promise<CalculationUserInputs> {
    return this.restClient.get({
      path: `/calculation/calculation-user-input/${calculationId}`,
    }) as Promise<CalculationUserInputs>
  }

  getUnsupportedValidation(prisonerId: string): Promise<ValidationMessage[]> {
    return this.restClient.get({
      path: `/validation/${prisonerId}/supported-validation`,
    }) as Promise<ValidationMessage[]>
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

  storeOverrideReason(overrideRequest: GenuineOverrideRequest) {
    return this.restClient.post({
      path: '/specialist-support/genuine-override',
      data: overrideRequest,
    }) as Promise<GenuineOverrideRequest>
  }

  storeOverrideCalculation(overrideCalculationRequest: GenuineOverrideDateRequest) {
    return this.restClient.post({
      path: '/specialist-support/genuine-override/calculation',
      data: overrideCalculationRequest,
    }) as Promise<GenuineOverrideDateResponse>
  }

  getGenuineOverride(calculationReference: string) {
    return this.restClient.get({
      path: `/specialist-support/genuine-override/calculation/${calculationReference}`,
    }) as Promise<GenuineOverrideRequest>
  }

  getNonReleaseFridayDay(date: string): Promise<NonFridayReleaseDay> {
    return this.restClient.get({ path: `/non-friday-release/${date}` }) as Promise<NonFridayReleaseDay>
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

  getAnalyzedSentencesAndOffences(bookingId: number): Promise<AnalyzedSentenceAndOffences[]> {
    return this.restClient.get({
      path: `/sentence-and-offence-information/${bookingId}`,
    }) as Promise<AnalyzedSentenceAndOffences[]>
  }

  getAnalyzedAdjustments(bookingId: number): Promise<AnalyzedPrisonApiBookingAndSentenceAdjustments> {
    return this.restClient.get({
      path: `/booking-and-sentence-adjustments/${bookingId}`,
    }) as Promise<AnalyzedPrisonApiBookingAndSentenceAdjustments>
  }

  getBookingManualEntryValidation(prisonerId: string) {
    return this.restClient.get({
      path: `/validation/${prisonerId}/manual-entry-validation`,
    }) as Promise<ValidationMessage[]>
  }
}

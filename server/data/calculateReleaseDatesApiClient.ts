import { asSystem, asUser, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import {
  AdjustmentDto,
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
  GenuineOverrideCreatedResponse,
  GenuineOverrideInputResponse,
  GenuineOverrideReason,
  GenuineOverrideRequest,
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
import logger from '../../logger'
import {
  AnalysedPrisonApiBookingAndSentenceAdjustments,
  PrisonApiPrisoner,
  PrisonApiReturnToCustodyDate,
} from '../@types/prisonApi/prisonClientTypes'
import ComparisonType from '../enumerations/comparisonType'
import ManualCalculationResponse from '../models/manual_calculation/ManualCalculationResponse'

export default class CalculateReleaseDatesApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Calculate release dates API', config.apis.calculateReleaseDates, logger, authenticationClient)
  }

  calculatePreliminaryReleaseDates(
    prisonerId: string,
    calculationRequestModel: CalculationRequestModel,
    username: string,
  ): Promise<BookingCalculation> {
    return this.post<BookingCalculation>(
      {
        path: `/calculation/${prisonerId}`,
        data: calculationRequestModel || null,
      },
      asSystem(username),
    )
  }

  getCalculationResults(calculationRequestId: number, username: string): Promise<BookingCalculation> {
    return this.get<BookingCalculation>(
      {
        path: `/calculation/results/${calculationRequestId}`,
      },
      asSystem(username),
    )
  }

  getCalculationBreakdown(calculationRequestId: number, username: string): Promise<CalculationBreakdown> {
    return this.get<CalculationBreakdown>(
      {
        path: `/calculation/breakdown/${calculationRequestId}`,
      },
      asSystem(username),
    )
  }

  getNextWorkingDay(date: string, username: string): Promise<WorkingDay> {
    return this.get<WorkingDay>({ path: `/working-day/next/${date}` }, asSystem(username))
  }

  getCalculationReasons(username: string): Promise<CalculationReason[]> {
    return this.get<CalculationReason[]>({ path: `/calculation-reasons/` }, asSystem(username))
  }

  getGenuineOverrideReasons(username: string): Promise<GenuineOverrideReason[]> {
    return this.get<GenuineOverrideReason[]>({ path: `/genuine-override/reasons` }, asSystem(username))
  }

  getPrisonerDetail(calculationId: number, username: string): Promise<PrisonApiPrisoner> {
    return this.get<PrisonApiPrisoner>({ path: `/calculation/prisoner-details/${calculationId}` }, asSystem(username))
  }

  getSentencesAndOffences(
    calculationId: number,
    username: string,
  ): Promise<SentenceAndOffenceWithReleaseArrangements[]> {
    return this.get<SentenceAndOffenceWithReleaseArrangements[]>(
      {
        path: `/calculation/sentence-and-offences/${calculationId}`,
      },
      asSystem(username),
    )
  }

  getReturnToCustodyDate(calculationId: number, username: string): Promise<PrisonApiReturnToCustodyDate> {
    return this.get<PrisonApiReturnToCustodyDate>(
      {
        path: `/calculation/return-to-custody/${calculationId}`,
      },
      asSystem(username),
    )
  }

  getBookingAndSentenceAdjustments(
    calculationId: number,
    username: string,
  ): Promise<AnalysedPrisonApiBookingAndSentenceAdjustments> {
    return this.get<AnalysedPrisonApiBookingAndSentenceAdjustments>(
      {
        path: `/calculation/adjustments/${calculationId}`,
      },
      asSystem(username),
    )
  }

  getAdjustmentsDtosForCalculation(calculationId: number, username: string): Promise<AdjustmentDto[]> {
    return this.get<AdjustmentDto[]>(
      {
        path: `/calculation/adjustments/${calculationId}`,
        query: { 'adjustments-api': true },
      },
      asSystem(username),
    )
  }

  getLatestCalculation(prisonerId: string, bookingId: number, username: string): Promise<BookingCalculation> {
    return this.get<BookingCalculation>(
      {
        path: `/calculation/results/${prisonerId}/${bookingId}`,
      },
      asSystem(username),
    )
  }

  getCalculationUserInputs(calculationId: number, username: string): Promise<CalculationUserInputs> {
    return this.get<CalculationUserInputs>(
      {
        path: `/calculation/calculation-user-input/${calculationId}`,
      },
      asSystem(username),
    )
  }

  getUnsupportedSentenceValidation(prisonerId: string, username: string): Promise<SupportedValidationResponse> {
    return this.get<SupportedValidationResponse>(
      {
        path: `/validation/${prisonerId}/supported-validation`,
      },
      asSystem(username),
    )
  }

  hasIndeterminateSentences(bookingId: number, username: string): Promise<boolean> {
    return this.get<boolean>(
      {
        path: `/manual-calculation/${bookingId}/has-indeterminate-sentences`,
      },
      asSystem(username),
    )
  }

  createPrisonComparison(prison: string, comparisonType: ComparisonType, username: string): Promise<Comparison> {
    return this.post<Comparison>(
      {
        path: '/comparison',
        data: { criteria: {}, prison, comparisonType },
      },
      asSystem(username),
    )
  }

  getPrisonComparison(comparisonReference: string, username: string): Promise<ComparisonOverview> {
    return this.get<ComparisonOverview>({ path: `/comparison/${comparisonReference}` }, asSystem(username))
  }

  getPrisonComparisons(username: string): Promise<ComparisonSummary[]> {
    return this.get<ComparisonSummary[]>({ path: '/comparison' }, asSystem(username))
  }

  getManualComparisons(username: string): Promise<ComparisonSummary[]> {
    return this.get<ComparisonSummary[]>({ path: '/comparison/manual' }, asSystem(username))
  }

  createManualComparison(prisonerIds: string[], username: string): Promise<Comparison> {
    return this.post<Comparison>(
      {
        path: '/comparison/manual',
        data: { prisonerIds },
      },
      asSystem(username),
    )
  }

  getManualComparison(comparisonReference: string, username: string): Promise<ComparisonOverview> {
    return this.get<ComparisonOverview>({ path: `/comparison/manual/${comparisonReference}` }, asSystem(username))
  }

  getPrisonMismatchComparison(
    comparisonReference: string,
    mismatchReference: string,
    username: string,
  ): Promise<ComparisonPersonOverview> {
    return this.get<ComparisonPersonOverview>(
      {
        path: `/comparison/${comparisonReference}/mismatch/${mismatchReference}`,
      },
      asSystem(username),
    )
  }

  getPrisonJsonMismatchComparison(
    comparisonReference: string,
    mismatchReference: string,
    username: string,
  ): Promise<ComparisonPersonJson> {
    return this.get<ComparisonPersonJson>(
      {
        path: `/comparison/${comparisonReference}/mismatch/${mismatchReference}/json`,
      },
      asSystem(username),
    )
  }

  getMismatchDiscrepancy(
    comparisonReference: string,
    mismatchReference: string,
    username: string,
  ): Promise<ComparisonPersonDiscrepancySummary> {
    return this.get<ComparisonPersonDiscrepancySummary>(
      {
        path: `/comparison/${comparisonReference}/mismatch/${mismatchReference}/discrepancy`,
      },
      asSystem(username),
    )
  }

  getManualMismatchDiscrepancy(
    comparisonReference: string,
    mismatchReference: string,
    username: string,
  ): Promise<ComparisonPersonDiscrepancySummary> {
    return this.get<ComparisonPersonDiscrepancySummary>(
      {
        path: `/comparison/manual/${comparisonReference}/mismatch/${mismatchReference}/discrepancy`,
      },
      asSystem(username),
    )
  }

  createMismatchDiscrepancy(
    comparisonReference: string,
    mismatchReference: string,
    discrepancy: ComparisonPersonDiscrepancyRequest,
    username: string,
  ): Promise<ComparisonPersonDiscrepancySummary> {
    return this.post<ComparisonPersonDiscrepancySummary>(
      {
        path: `/comparison/${comparisonReference}/mismatch/${mismatchReference}/discrepancy`,
        data: discrepancy,
      },
      asSystem(username),
    )
  }

  createManualMismatchDiscrepancy(
    comparisonReference: string,
    mismatchReference: string,
    discrepancy: ComparisonPersonDiscrepancyRequest,
    username: string,
  ): Promise<ComparisonPersonDiscrepancySummary> {
    return this.post<ComparisonPersonDiscrepancySummary>(
      {
        path: `/comparison/manual/${comparisonReference}/mismatch/${mismatchReference}/discrepancy`,
        data: discrepancy,
      },
      asSystem(username),
    )
  }

  getManualMismatchComparison(
    comparisonReference: string,
    mismatchReference: string,
    username: string,
  ): Promise<ComparisonPersonOverview> {
    return this.get<ComparisonPersonOverview>(
      {
        path: `/comparison/manual/${comparisonReference}/mismatch/${mismatchReference}`,
      },
      asSystem(username),
    )
  }

  getDisabledNomisAgencies(username: string): Promise<Agency[]> {
    return this.get<Agency[]>(
      {
        path: `/feature-toggle/nomis-calc-disabled`,
      },
      asSystem(username),
    )
  }

  updateDisabledNomisAgencies(username: string): Promise<AgencySwitchUpdateResult> {
    return this.post<AgencySwitchUpdateResult>(
      {
        path: `/feature-toggle/nomis-calc-disabled`,
      },
      asSystem(username),
    )
  }

  getAnalysedSentencesAndOffences(bookingId: number, username: string): Promise<AnalysedSentenceAndOffence[]> {
    return this.get<AnalysedSentenceAndOffence[]>(
      {
        path: `/sentence-and-offence-information/${bookingId}`,
      },
      asSystem(username),
    )
  }

  getAnalysedAdjustments(bookingId: number, username: string): Promise<AnalysedPrisonApiBookingAndSentenceAdjustments> {
    return this.get<AnalysedPrisonApiBookingAndSentenceAdjustments>(
      {
        path: `/booking-and-sentence-adjustments/${bookingId}`,
      },
      asSystem(username),
    )
  }

  getAdjustmentsForPrisoner(prisonerId: string, username: string): Promise<AnalysedAdjustment[]> {
    return this.get<AnalysedAdjustment[]>(
      {
        path: `/adjustments/${prisonerId}`,
      },
      asSystem(username),
    )
  }

  validate(prisonerId: string, userInput: CalculationUserInputs, username): Promise<ValidationMessage[]> {
    return this.post<ValidationMessage[]>(
      {
        path: `/validation/${prisonerId}/full-validation`,
        data: userInput || null,
      },
      asSystem(username),
    )
  }

  getBookingManualEntryValidation(prisonerId: string, username: string): Promise<ValidationMessage[]> {
    return this.get<ValidationMessage[]>(
      {
        path: `/validation/${prisonerId}/manual-entry-validation`,
      },
      asSystem(username),
    )
  }

  getManualEntryDateValidation(dateTypes: string[], username: string): Promise<ValidationMessage[]> {
    return this.get<ValidationMessage[]>(
      {
        path: `/validation/manual-entry-dates-validation?releaseDates=${dateTypes.join(',')}`,
      },
      asSystem(username),
    )
  }

  getCalculationHistory(prisonerId: string, username: string): Promise<HistoricCalculation[]> {
    return this.get<HistoricCalculation[]>(
      {
        path: `/historicCalculations/${prisonerId}`,
      },
      asSystem(username),
    )
  }

  getDetailedCalculationResults(calculationRequestId: number, username: string): Promise<DetailedCalculationResults> {
    return this.get<DetailedCalculationResults>(
      {
        path: `/calculation/detailed-results/${calculationRequestId}`,
      },
      asSystem(username),
    )
  }

  getLatestCalculationForPrisoner(prisonerId: string, username: string): Promise<LatestCalculation> {
    return this.get<LatestCalculation>(
      {
        path: `/calculation/${prisonerId}/latest`,
      },
      asSystem(username),
    )
  }

  getNomisCalculationSummary(offenderSentCalcId: number, username: string): Promise<NomisCalculationSummary> {
    return this.get<NomisCalculationSummary>(
      {
        path: `/calculation/nomis-calculation-summary/${offenderSentCalcId}`,
      },
      asSystem(username),
    )
  }

  getReleaseDatesForACalcReqId(calcReqId: number, username: string): Promise<ReleaseDatesAndCalculationContext> {
    return this.get<ReleaseDatesAndCalculationContext>(
      {
        path: `/calculation/release-dates/${calcReqId}`,
      },
      asSystem(username),
    )
  }

  async getDateTypeDefinitions(username: string): Promise<DateTypeDefinition[]> {
    return this.get<DateTypeDefinition[]>(
      {
        path: '/reference-data/date-type',
      },
      asSystem(username),
    )
  }

  getErsedEligibility(bookingId: number, username: string): Promise<ErsedEligibility> {
    return this.get<ErsedEligibility>(
      {
        path: `/eligibility/${bookingId}/ersed`,
      },
      asSystem(username),
    )
  }

  getGenuineOverrideInputs(calculationRequestId: number, username: string): Promise<GenuineOverrideInputResponse> {
    return this.get<GenuineOverrideInputResponse>(
      {
        path: `/genuine-override/calculation/${calculationRequestId}/inputs`,
      },
      asSystem(username),
    )
  }

  getApprovedDatesInputs(prisonerId: string, username: string): Promise<ApprovedDatesInputResponse> {
    return this.get<ApprovedDatesInputResponse>(
      {
        path: `/approved-dates/${prisonerId}/inputs`,
      },
      asSystem(username),
    )
  }

  hasRecallSentences(bookingId: number, username: string): Promise<boolean> {
    return this.get<boolean>(
      {
        path: `/manual-calculation/${bookingId}/has-recall-sentences`,
      },
      asSystem(username),
    )
  }

  hasExistingManualCalculation(prisonerId: string, username: string): Promise<boolean> {
    return this.get<boolean>(
      {
        path: `/manual-calculation/${prisonerId}/has-existing-calculation`,
      },
      asSystem(username),
    )
  }

  confirmCalculation(
    calculationRequestId: number,
    body: SubmitCalculationRequest,
    token: string,
  ): Promise<BookingCalculation> {
    return this.post<BookingCalculation>(
      {
        path: `/calculation/confirm/${calculationRequestId}`,
        data: body,
      },
      asUser(token),
    )
  }

  createGenuineOverrideForCalculation(
    calculationRequestId: number,
    body: GenuineOverrideRequest,
    username: string,
  ): Promise<GenuineOverrideCreatedResponse> {
    return this.post<GenuineOverrideCreatedResponse>(
      {
        path: `/genuine-override/calculation/${calculationRequestId}`,
        data: body,
      },
      asSystem(username),
    )
  }

  storeManualCalculation(
    nomsId: string,
    manualEntryRequest: ManualEntryRequest,
    username: string,
  ): Promise<ManualCalculationResponse> {
    return this.post<ManualCalculationResponse>(
      {
        path: `/manual-calculation/${nomsId}`,
        data: manualEntryRequest,
      },
      asSystem(username),
    )
  }
}

import config, { ApiConfig } from '../config'
import RestClient from '../data/restClient'
import {
  BookingCalculation,
  CalculationBreakdown,
  CalculationResults,
  CalculationUserInputs,
  CalculationUserQuestions,
  GenuineOverride,
  GenuineOverrideDateRequest,
  GenuineOverrideDateResponse,
  ManualEntryDate,
  NonFridayReleaseDay,
  SubmitCalculationRequest,
  ValidationMessage,
  WorkingDay,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import {
  PrisonApiBookingAndSentenceAdjustments,
  PrisonApiOffenderSentenceAndOffences,
  PrisonApiPrisoner,
  PrisonApiReturnToCustodyDate,
} from '../@types/prisonApi/prisonClientTypes'
import ManualCalculationResponse from '../models/ManualCalculationResponse'

export default class CalculateReleaseDatesApiClient {
  restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient(
      'Calculate release dates API',
      config.apis.calculateReleaseDates as ApiConfig,
      token
    )
  }

  // TODO test method - will be removed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
  calculateReleaseDates(booking: any): Promise<BookingCalculation> {
    return this.restClient.post({ path: '/test/calculation-by-booking', data: booking }) as Promise<BookingCalculation>
  }

  calculatePreliminaryReleaseDates(prisonerId: string, userInput: CalculationUserInputs): Promise<BookingCalculation> {
    return this.restClient.post({
      path: `/calculation/${prisonerId}`,
      data: userInput || null,
    }) as Promise<BookingCalculation>
  }

  calculateTestReleaseDates(prisonerId: string, userInput: CalculationUserInputs): Promise<CalculationResults> {
    return this.restClient.post({
      path: `/calculation/${prisonerId}/test`,
      data: userInput || null,
    }) as Promise<CalculationResults>
  }

  getCalculationResults(calculationRequestId: number): Promise<BookingCalculation> {
    return this.restClient.get({
      path: `/calculation/results/${calculationRequestId}`,
    }) as Promise<BookingCalculation>
  }

  getCalculationResultsByReference(calculationReference: string): Promise<BookingCalculation> {
    return this.restClient.get({
      path: `/calculationReference/${calculationReference}`,
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

  getBookingAndSentenceAdjustments(calculationId: number): Promise<PrisonApiBookingAndSentenceAdjustments> {
    return this.restClient.get({
      path: `/calculation/adjustments/${calculationId}`,
    }) as Promise<PrisonApiBookingAndSentenceAdjustments>
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

  storeManualCalculation(nomsId: string, selectedManualEntryDates: ManualEntryDate[]) {
    return this.restClient.post({
      path: `/manual-calculation/${nomsId}`,
      data: { selectedManualEntryDates },
    }) as Promise<ManualCalculationResponse>
  }

  storeOverrideReason(overrideRequest: GenuineOverride) {
    return this.restClient.post({
      path: '/specialist-support/genuine-override',
      data: overrideRequest,
    }) as Promise<GenuineOverride>
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
    }) as Promise<GenuineOverride>
  }

  getNonReleaseFridayDay(date: string): Promise<NonFridayReleaseDay> {
    return this.restClient.get({ path: `/non-friday-release/${date}` }) as Promise<NonFridayReleaseDay>
  }
}

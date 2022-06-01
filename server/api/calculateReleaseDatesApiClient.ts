import config, { ApiConfig } from '../config'
import RestClient from './restClient'
import {
  BookingCalculation,
  CalculationBreakdown,
  CalculationFragments,
  CalculationUserInputs,
  CalculationUserQuestions,
  ValidationMessages,
  WorkingDay,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import {
  PrisonApiBookingAndSentenceAdjustments,
  PrisonApiPrisoner,
  PrisonApiReturnToCustodyDate,
} from '../@types/prisonApi/prisonClientTypes'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/PrisonApiOffenderSentenceAndOffences'

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
    return this.restClient.post({ path: `/calculation/${prisonerId}`, data: userInput }) as Promise<BookingCalculation>
  }

  getCalculationResults(calculationRequestId: number): Promise<BookingCalculation> {
    return this.restClient.get({
      path: `/calculation/results/${calculationRequestId}`,
    }) as Promise<BookingCalculation>
  }

  getCalculationBreakdown(calculationRequestId: number): Promise<CalculationBreakdown> {
    return this.restClient.get({
      path: `/calculation/breakdown/${calculationRequestId}`,
    }) as Promise<CalculationBreakdown>
  }

  confirmCalculation(
    prisonerId: string,
    calculationRequestId: number,
    body: CalculationFragments
  ): Promise<BookingCalculation> {
    return this.restClient.post({
      path: `/calculation/${prisonerId}/confirm/${calculationRequestId}`,
      data: body,
    }) as Promise<BookingCalculation>
  }

  getNextWorkingDay(date: string): Promise<WorkingDay> {
    return this.restClient.get({ path: `/working-day/next/${date}` }) as Promise<WorkingDay>
  }

  getPreviousWorkingDay(date: string): Promise<WorkingDay> {
    return this.restClient.get({ path: `/working-day/previous/${date}` }) as Promise<WorkingDay>
  }

  validate(prisonerId: string, userInput: CalculationUserInputs): Promise<ValidationMessages> {
    return this.restClient.post({
      path: `/calculation/${prisonerId}/validate`,
      data: userInput,
    }) as Promise<ValidationMessages>
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
}

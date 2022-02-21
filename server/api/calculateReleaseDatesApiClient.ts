import config, { ApiConfig } from '../config'
import RestClient from './restClient'
import {
  BookingCalculation,
  CalculationBreakdown,
  CalculationFragments,
  ValidationMessages,
  WorkingDay,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import {
  PrisonApiBookingAndSentenceAdjustments,
  PrisonApiOffenderSentenceAndOffences,
  PrisonApiPrisoner,
} from '../@types/prisonApi/prisonClientTypes'

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

  calculatePreliminaryReleaseDates(prisonerId: string): Promise<BookingCalculation> {
    return this.restClient.post({ path: `/calculation/${prisonerId}` }) as Promise<BookingCalculation>
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

  validate(prisonerId: string): Promise<ValidationMessages> {
    return this.restClient.get({ path: `/calculation/${prisonerId}/validate` }) as Promise<ValidationMessages>
  }

  getPrisonerDetail(calculationId: number): Promise<PrisonApiPrisoner> {
    return this.restClient.get({ path: `/calculation/prisoner-details/${calculationId}` }) as Promise<PrisonApiPrisoner>
  }

  getSentencesAndOffences(calculationId: number): Promise<PrisonApiOffenderSentenceAndOffences[]> {
    return this.restClient.get({
      path: `/calculation/sentence-and-offences/${calculationId}`,
    }) as Promise<PrisonApiOffenderSentenceAndOffences[]>
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
}

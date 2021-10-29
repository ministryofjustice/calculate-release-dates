import config, { ApiConfig } from '../config'
import RestClient from './restClient'
import {
  BookingCalculation,
  TestData,
  WorkingDay,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

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
  getTestData(): Promise<TestData[]> {
    return this.restClient.get({ path: '/test/data' }) as Promise<TestData[]>
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
    return this.restClient.get({ path: `/calculation/results/${calculationRequestId}` }) as Promise<BookingCalculation>
  }

  confirmCalculation(prisonerId: string, calculationRequestId: number): Promise<BookingCalculation> {
    return this.restClient.post({
      path: `/calculation/${prisonerId}/confirm/${calculationRequestId}`,
    }) as Promise<BookingCalculation>
  }

  getNextWorkingDay(date: string): Promise<WorkingDay> {
    return this.restClient.get({ path: `/working-day/next/${date}` }) as Promise<WorkingDay>
  }

  getPreviousWorkingDay(date: string): Promise<WorkingDay> {
    return this.restClient.get({ path: `/working-day/previous/${date}` }) as Promise<WorkingDay>
  }
}

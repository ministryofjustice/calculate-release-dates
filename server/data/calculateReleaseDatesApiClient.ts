import config, { ApiConfig } from '../config'
import RestClient from './restClient'
import {
  BookingCalculation,
  GenuineOverrideCreatedResponse,
  GenuineOverrideRequest,
  ManualEntryRequest,
  SubmitCalculationRequest,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
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

  storeManualCalculation(nomsId: string, manualEntryRequest: ManualEntryRequest) {
    return this.restClient.post({
      path: `/manual-calculation/${nomsId}`,
      data: manualEntryRequest,
    }) as Promise<ManualCalculationResponse>
  }
}

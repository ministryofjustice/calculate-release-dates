import { Request } from 'express'
import CalculateReleaseDatesApiClient from '../api/calculateReleaseDatesApiClient'
import ManualCalculationResponse from '../models/ManualCalculationResponse'
import {
  GenuineOverrideDateRequest,
  GenuineOverrideDateResponse,
  ManualEntryRequest,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

export default class ManualCalculationService {
  async hasIndeterminateSentences(bookingId: number, token: string): Promise<boolean> {
    return new CalculateReleaseDatesApiClient(token).hasIndeterminateSentences(bookingId)
  }

  async storeManualCalculation(prisonerId: string, req: Request, token: string): Promise<ManualCalculationResponse> {
    return new CalculateReleaseDatesApiClient(token).storeManualCalculation(prisonerId, {
      selectedManualEntryDates: req.session.selectedManualEntryDates[prisonerId],
      reasonForCalculationId: req.session.calculationReasonId[prisonerId],
      otherReasonDescription: req.session.otherReasonDescription[prisonerId],
    } as ManualEntryRequest)
  }

  async storeGenuineOverrideCalculation(
    originalCalculationReference: string,
    prisonerId: string,
    req: Request,
    token: string
  ): Promise<GenuineOverrideDateResponse> {
    const request = {
      originalCalculationReference,
      manualEntryRequest: {
        selectedManualEntryDates: req.session.selectedManualEntryDates[prisonerId],
      },
    } as GenuineOverrideDateRequest
    return new CalculateReleaseDatesApiClient(token).storeOverrideCalculation(request)
  }
}

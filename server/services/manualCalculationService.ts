import { Request } from 'express'
import CalculateReleaseDatesApiClient from '../api/calculateReleaseDatesApiClient'
import ManualCalculationResponse from '../models/ManualCalculationResponse'

export default class ManualCalculationService {
  async hasIndeterminateSentences(bookingId: number, token: string): Promise<boolean> {
    return new CalculateReleaseDatesApiClient(token).hasIndeterminateSentences(bookingId)
  }

  async storeManualCalculation(prisonerId: string, req: Request, token: string): Promise<ManualCalculationResponse> {
    return new CalculateReleaseDatesApiClient(token).storeManualCalculation(
      prisonerId,
      req.session.selectedManualEntryDates[prisonerId]
    )
  }
}

import { Request } from 'express'
import CalculateReleaseDatesApiClient from '../api/calculateReleaseDatesApiClient'
import ManualCalculationResponse from '../models/ManualCalculationResponse'
import {
  GenuineOverrideDateRequest,
  GenuineOverrideDateResponse,
  ManualEntryRequest,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import AuditService from './auditService'

export default class ManualCalculationService {
  constructor(private readonly auditService: AuditService) {}

  async hasIndeterminateSentences(bookingId: number, token: string): Promise<boolean> {
    return new CalculateReleaseDatesApiClient(token).hasIndeterminateSentences(bookingId)
  }

  async hasRecallSentences(bookingId: number, token: string): Promise<boolean> {
    return new CalculateReleaseDatesApiClient(token).hasRecallSentences(bookingId)
  }

  async storeManualCalculation(
    userName: string,
    prisonerId: string,
    req: Request,
    token: string,
  ): Promise<ManualCalculationResponse> {
    if (req.session.calculationReasonId == null) {
      req.session.calculationReasonId = {}
      req.session.otherReasonDescription = {}
    }
    const reasonId = req.session.calculationReasonId[prisonerId]
    try {
      const calculation = await new CalculateReleaseDatesApiClient(token).storeManualCalculation(prisonerId, {
        selectedManualEntryDates: req.session.selectedManualEntryDates[prisonerId],
        reasonForCalculationId: reasonId,
        otherReasonDescription: req.session.otherReasonDescription[prisonerId],
      } as ManualEntryRequest)
      await this.auditService.publishManualSentenceCalculation(userName, prisonerId, calculation.enteredDates, reasonId)
      return calculation
    } catch (error) {
      await this.auditService.publishManualSentenceCalculationFailure(userName, prisonerId, error)
      throw error
    }
  }

  async storeGenuineOverrideCalculation(
    originalCalculationReference: string,
    prisonerId: string,
    req: Request,
    token: string,
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

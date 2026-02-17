import { Request } from 'express'
import ManualCalculationResponse from '../models/manual_calculation/ManualCalculationResponse'
import { ManualEntryRequest } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import AuditService from './auditService'
import { ManualJourneySelectedDate } from '../types/ManualJourney'
import CalculateReleaseDatesApiClient from '../data/calculateReleaseDatesApiClient'

export default class ManualCalculationService {
  constructor(
    private readonly auditService: AuditService,
    private readonly calculateReleaseDatesApiClient: CalculateReleaseDatesApiClient,
  ) {}

  async hasIndeterminateSentences(bookingId: number, username: string): Promise<boolean> {
    return this.calculateReleaseDatesApiClient.hasIndeterminateSentences(bookingId, username)
  }

  async hasRecallSentences(bookingId: number, username: string): Promise<boolean> {
    return this.calculateReleaseDatesApiClient.hasRecallSentences(bookingId, username)
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
    const manualDates = req.session.selectedManualEntryDates[prisonerId].map(
      (d: ManualJourneySelectedDate) => d.manualEntrySelectedDate,
    )
    try {
      const calculation = await this.calculateReleaseDatesApiClient.storeManualCalculation(
        prisonerId,
        {
          selectedManualEntryDates: manualDates,
          reasonForCalculationId: reasonId,
          otherReasonDescription: req.session.otherReasonDescription[prisonerId],
        } as ManualEntryRequest,
        token,
      )
      await this.auditService.publishManualSentenceCalculation(userName, prisonerId, calculation.enteredDates, reasonId)
      return calculation
    } catch (error) {
      await this.auditService.publishManualSentenceCalculationFailure(userName, prisonerId, error)
      throw error
    }
  }
}

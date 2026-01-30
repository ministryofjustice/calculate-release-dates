import { Request } from 'express'
import CalculateReleaseDatesApiClient from '../data/calculateReleaseDatesApiClient'
import ManualCalculationResponse from '../models/manual_calculation/ManualCalculationResponse'
import { ManualEntryRequest } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import AuditService from './auditService'
import { ManualJourneySelectedDate } from '../types/ManualJourney'
import CalculateReleaseDatesApiRestClient from '../data/calculateReleaseDatesApiRestClient'

export default class ManualCalculationService {
  constructor(
    private readonly auditService: AuditService,
    private readonly calculateReleaseDatesApiClient: CalculateReleaseDatesApiRestClient,
  ) {}

  async hasIndeterminateSentences(bookingId: number, username: string): Promise<boolean> {
    return this.calculateReleaseDatesApiClient.hasIndeterminateSentences(bookingId, username)
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
    const manualDates = req.session.selectedManualEntryDates[prisonerId].map(
      (d: ManualJourneySelectedDate) => d.manualEntrySelectedDate,
    )
    try {
      const calculation = await new CalculateReleaseDatesApiClient(token).storeManualCalculation(prisonerId, {
        selectedManualEntryDates: manualDates,
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
}

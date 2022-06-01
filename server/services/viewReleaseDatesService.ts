import {
  BookingCalculation,
  CalculationUserInputs,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/PrisonApiOffenderSentenceAndOffences'
import {
  PrisonApiBookingAndSentenceAdjustments,
  PrisonApiPrisoner,
  PrisonApiReturnToCustodyDate,
} from '../@types/prisonApi/prisonClientTypes'
import CalculateReleaseDatesApiClient from '../api/calculateReleaseDatesApiClient'

export default class ViewReleaseDatesService {
  async getLatestCalculation(prisonerId: string, bookingId: number, token: string): Promise<BookingCalculation> {
    return new CalculateReleaseDatesApiClient(token).getLatestCalculation(prisonerId, bookingId)
  }

  async getBookingAndSentenceAdjustments(
    calculationId: number,
    token: string
  ): Promise<PrisonApiBookingAndSentenceAdjustments> {
    return new CalculateReleaseDatesApiClient(token).getBookingAndSentenceAdjustments(calculationId)
  }

  async getSentencesAndOffences(calculationId: number, token: string): Promise<PrisonApiOffenderSentenceAndOffences[]> {
    return new CalculateReleaseDatesApiClient(token).getSentencesAndOffences(calculationId)
  }

  async getPrisonerDetail(calculationId: number, userCaseloads: string[], token: string): Promise<PrisonApiPrisoner> {
    return new CalculateReleaseDatesApiClient(token).getPrisonerDetail(calculationId)
  }

  async getReturnToCustodyDate(calculationId: number, token: string): Promise<PrisonApiReturnToCustodyDate> {
    return new CalculateReleaseDatesApiClient(token).getReturnToCustodyDate(calculationId)
  }

  async getCalculationUserInputs(calculationId: number, token: string): Promise<CalculationUserInputs> {
    return new CalculateReleaseDatesApiClient(token).getCalculationUserInputs(calculationId)
  }
}

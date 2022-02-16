import { BookingCalculation } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import {
  PrisonApiBookingAndSentenceAdjustments,
  PrisonApiOffenderSentenceAndOffences,
  PrisonApiPrisoner,
} from '../@types/prisonApi/prisonClientTypes'
import CalculateReleaseDatesApiClient from '../api/calculateReleaseDatesApiClient'
import { FullPageError } from '../types/FullPageError'

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
    const prisonerDetail = await new CalculateReleaseDatesApiClient(token).getPrisonerDetail(calculationId)
    if (!userCaseloads.includes(prisonerDetail.agencyId)) {
      throw FullPageError.notInCaseLoadError()
    }
    return prisonerDetail
  }
}

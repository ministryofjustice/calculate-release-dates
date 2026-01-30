import {
  AdjustmentDto,
  BookingCalculation,
  CalculationUserInputs,
  SentenceAndOffenceWithReleaseArrangements,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import {
  AnalysedPrisonApiBookingAndSentenceAdjustments,
  PrisonApiPrisoner,
  PrisonApiReturnToCustodyDate,
} from '../@types/prisonApi/prisonClientTypes'
import CalculateReleaseDatesApiRestClient from '../data/calculateReleaseDatesApiRestClient'

export default class ViewReleaseDatesService {
  constructor(private readonly calculateReleaseDatesApiRestClient: CalculateReleaseDatesApiRestClient) {}

  async getLatestCalculation(prisonerId: string, bookingId: number, username: string): Promise<BookingCalculation> {
    return this.calculateReleaseDatesApiRestClient.getLatestCalculation(prisonerId, bookingId, username)
  }

  async getBookingAndSentenceAdjustments(
    calculationId: number,
    username: string,
  ): Promise<AnalysedPrisonApiBookingAndSentenceAdjustments> {
    return this.calculateReleaseDatesApiRestClient.getBookingAndSentenceAdjustments(calculationId, username)
  }

  async getAdjustmentsDtosForCalculation(calculationId: number, username: string): Promise<AdjustmentDto[]> {
    return this.calculateReleaseDatesApiRestClient.getAdjustmentsDtosForCalculation(calculationId, username)
  }

  async getSentencesAndOffences(
    calculationId: number,
    username: string,
  ): Promise<SentenceAndOffenceWithReleaseArrangements[]> {
    return this.calculateReleaseDatesApiRestClient.getSentencesAndOffences(calculationId, username)
  }

  async getPrisonerDetail(calculationId: number, username: string): Promise<PrisonApiPrisoner> {
    return this.calculateReleaseDatesApiRestClient.getPrisonerDetail(calculationId, username)
  }

  async getReturnToCustodyDate(calculationId: number, username: string): Promise<PrisonApiReturnToCustodyDate> {
    return this.calculateReleaseDatesApiRestClient.getReturnToCustodyDate(calculationId, username)
  }

  async getCalculationUserInputs(calculationId: number, username: string): Promise<CalculationUserInputs> {
    try {
      // await the result, so we can catch a 404 error.
      return await this.calculateReleaseDatesApiRestClient.getCalculationUserInputs(calculationId, username)
    } catch (error) {
      // eslint doesn't like any, but unknown is a primitive
      if ('responseStatus' in error && error.responseStatus === 404) {
        // If the calculation didn't have an user inputs, return null and continue.
        return null
      }
      throw error
    }
  }
}

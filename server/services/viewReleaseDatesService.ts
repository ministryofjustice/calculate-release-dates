// eslint-disable-next-line
import { HTTPError } from 'superagent' // eslint thinks this is unused.
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
import CalculateReleaseDatesApiClient from '../api/calculateReleaseDatesApiClient'

export default class ViewReleaseDatesService {
  async getLatestCalculation(prisonerId: string, bookingId: number, token: string): Promise<BookingCalculation> {
    return new CalculateReleaseDatesApiClient(token).getLatestCalculation(prisonerId, bookingId)
  }

  async getBookingAndSentenceAdjustments(
    calculationId: number,
    token: string,
  ): Promise<AnalysedPrisonApiBookingAndSentenceAdjustments> {
    return new CalculateReleaseDatesApiClient(token).getBookingAndSentenceAdjustments(calculationId)
  }

  async getAdjustmentsDtosForCalculation(calculationId: number, token: string): Promise<AdjustmentDto[]> {
    return new CalculateReleaseDatesApiClient(token).getAdjustmentsDtosForCalculation(calculationId)
  }

  async getSentencesAndOffences(
    calculationId: number,
    token: string,
  ): Promise<SentenceAndOffenceWithReleaseArrangements[]> {
    return new CalculateReleaseDatesApiClient(token).getSentencesAndOffences(calculationId)
  }

  async getPrisonerDetail(calculationId: number, userCaseloads: string[], token: string): Promise<PrisonApiPrisoner> {
    return new CalculateReleaseDatesApiClient(token).getPrisonerDetail(calculationId)
  }

  async getReturnToCustodyDate(calculationId: number, token: string): Promise<PrisonApiReturnToCustodyDate> {
    return new CalculateReleaseDatesApiClient(token).getReturnToCustodyDate(calculationId)
  }

  async getCalculationUserInputs(calculationId: number, token: string): Promise<CalculationUserInputs> {
    try {
      // await the result, so we can catch a 404 error.
      return await new CalculateReleaseDatesApiClient(token).getCalculationUserInputs(calculationId)
      // eslint-disable-next-line
    } catch (error: HTTPError | any) {
      // eslint doesn't like any, but unknown is a primitive
      if ('status' in error) {
        if (error.status === 404) {
          // If the calculation didn't have an user inputs, return null and continue.
          return null
        }
      }
      throw error
    }
  }
}

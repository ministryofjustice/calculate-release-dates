import CalculateReleaseDatesApiClient from '../api/calculateReleaseDatesApiClient'
import HmppsAuthClient from '../api/hmppsAuthClient'
import {
  BookingCalculation,
  TestData,
  WorkingDay,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

export default class CalculateReleaseDatesService {
  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
  async calculateReleaseDates(username: string, booking: any): Promise<BookingCalculation> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const bookingData = JSON.parse(booking)
    return new CalculateReleaseDatesApiClient(token).calculateReleaseDates(bookingData)
  }

  async calculatePreliminaryReleaseDates(username: string, prisonerId: string): Promise<BookingCalculation> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    return new CalculateReleaseDatesApiClient(token).calculatePreliminaryReleaseDates(prisonerId)
  }

  async getCalculationResults(username: string, calculationRequestId: number): Promise<BookingCalculation> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    return new CalculateReleaseDatesApiClient(token).getCalculationResults(calculationRequestId)
  }

  async confirmCalculation(
    username: string,
    prisonerId: string,
    calculationRequestId: number
  ): Promise<BookingCalculation> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    return new CalculateReleaseDatesApiClient(token).confirmCalculation(prisonerId, calculationRequestId)
  }

  async getWeekendAdjustments(
    username: string,
    calculation: BookingCalculation
  ): Promise<{ [key: string]: WorkingDay }> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const client = new CalculateReleaseDatesApiClient(token)
    const adjustments: { [key: string]: WorkingDay } = {}
    if (calculation.dates.CRD) {
      const adjustment = await client.getPreviousWorkingDay(calculation.dates.CRD)
      if (adjustment.date !== calculation.dates.CRD) {
        adjustments.CRD = adjustment
      }
    }
    if (calculation.dates.HDCED) {
      const adjustment = await client.getNextWorkingDay(calculation.dates.HDCED)
      if (adjustment.date !== calculation.dates.HDCED) {
        adjustments.HDCED = adjustment
      }
    }
    return adjustments
  }
}

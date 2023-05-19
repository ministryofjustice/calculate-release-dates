import CalculateReleaseDatesApiClient from '../api/calculateReleaseDatesApiClient'

export default class ManualCalculationService {
  async hasIndeterminateSentences(bookingId: number, token: string): Promise<boolean> {
    return new CalculateReleaseDatesApiClient(token).hasIndeterminateSentences(bookingId)
  }
}

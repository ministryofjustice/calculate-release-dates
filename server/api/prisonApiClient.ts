import { Readable } from 'stream'
import config, { ApiConfig } from '../config'
import RestClient from '../data/restClient'
import type {
  PrisonApiBookingAndSentenceAdjustments,
  PrisonApiOffenderFinePayment,
  PrisonApiOffenderSentenceAndOffences,
  PrisonApiPrisoner,
  PrisonApiReturnToCustodyDate,
  PrisonApiSentenceAdjustmentDetail,
  PrisonApiUserCaseloads,
  PrisonApiOffenderCalculatedKeyDates,
} from '../@types/prisonApi/prisonClientTypes'
import { PrisonApiSentenceCalcDates } from '../@types/prisonApi/prisonClientTypes'

export default class PrisonApiClient {
  restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient('Prison API', config.apis.prisonApi as ApiConfig, token)
  }

  async getPrisonerImage(nomsId: string): Promise<Readable> {
    return this.restClient.stream({
      path: `/api/bookings/offenderNo/${nomsId}/image/data`,
    }) as Promise<Readable>
  }

  async getPrisonerDetail(nomsId: string): Promise<PrisonApiPrisoner> {
    return this.restClient.get({ path: `/api/offenders/${nomsId}` }) as Promise<PrisonApiPrisoner>
  }

  async getUsersCaseloads(): Promise<PrisonApiUserCaseloads[]> {
    return this.restClient.get({ path: `/api/users/me/caseLoads` }) as Promise<PrisonApiUserCaseloads[]>
  }

  async getSentenceAdjustments(bookingId: number): Promise<PrisonApiSentenceAdjustmentDetail> {
    return this.restClient.get({
      path: `/api/bookings/${bookingId}/sentenceAdjustments`,
    }) as Promise<PrisonApiSentenceAdjustmentDetail>
  }

  async getSentencesAndOffences(bookingId: number): Promise<PrisonApiOffenderSentenceAndOffences[]> {
    return this.restClient.get({
      path: `/api/offender-sentences/booking/${bookingId}/sentences-and-offences`,
    }) as Promise<PrisonApiOffenderSentenceAndOffences[]>
  }

  async getSentenceDetail(bookingId: number): Promise<PrisonApiSentenceCalcDates> {
    return this.restClient.get({
      path: `/api/bookings/${bookingId}/sentenceDetail`,
    }) as Promise<PrisonApiSentenceCalcDates>
  }

  async getBookingAndSentenceAdjustments(bookingId: number): Promise<PrisonApiBookingAndSentenceAdjustments> {
    return this.restClient.get({
      path: `/api/adjustments/${bookingId}/sentence-and-booking`,
    }) as Promise<PrisonApiBookingAndSentenceAdjustments>
  }

  async getReturnToCustodyDate(bookingId: number): Promise<PrisonApiReturnToCustodyDate> {
    return this.restClient.get({
      path: `/api/bookings/${bookingId}/return-to-custody`,
    }) as Promise<PrisonApiReturnToCustodyDate>
  }

  async getOffenderKeyDates(bookingId: number): Promise<PrisonApiOffenderCalculatedKeyDates> {
    return this.restClient.get({
      path: `/api/offender-dates/${bookingId}`,
    }) as Promise<PrisonApiOffenderCalculatedKeyDates>
  }

  async getOffenderFinePayments(bookingId: number): Promise<PrisonApiOffenderFinePayment[]> {
    return this.restClient.get({
      path: `/api/offender-fine-payment/booking/${bookingId}`,
    }) as Promise<PrisonApiOffenderFinePayment[]>
  }
}

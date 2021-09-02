import { Readable } from 'stream'
import config, { ApiConfig } from '../config'
import RestClient from './restClient'
import type {
  PrisonApiPrisoner,
  PrisonApiSentenceAdjustmentDetail,
  PrisonApiUserDetail,
} from '../@types/prisonApi/prisonClientTypes'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'

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

  // TODO: Currently unused
  async getPrisonUser(targetUsername: string): Promise<PrisonApiUserDetail> {
    return this.restClient.get({ path: `/api/users/${targetUsername}` }) as Promise<PrisonApiUserDetail>
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
}

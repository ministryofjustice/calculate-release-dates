import { Readable } from 'stream'
import config, { ApiConfig } from '../config'
import RestClient from '../data/restClient'
import type {
  PrisonApiOffenderSentenceAndOffences,
  PrisonApiPrisoner,
  PrisonApiFixedTermRecallDetails,
  PrisonApiUserCaseloads,
  PrisonApiPrison,
  PrisonApiPrisonDetails,
} from '../@types/prisonApi/prisonClientTypes'

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

  async getSentencesAndOffences(bookingId: number): Promise<PrisonApiOffenderSentenceAndOffences[]> {
    return this.restClient.get({
      path: `/api/offender-sentences/booking/${bookingId}/sentences-and-offences`,
    }) as Promise<PrisonApiOffenderSentenceAndOffences[]>
  }

  async getFixedTermRecallDetails(bookingId: number): Promise<PrisonApiFixedTermRecallDetails> {
    return this.restClient.get({
      path: `/api/bookings/${bookingId}/fixed-term-recall`,
    }) as Promise<PrisonApiFixedTermRecallDetails>
  }

  async getActivePrisons(): Promise<PrisonApiPrison[]> {
    return this.restClient.get({ path: `/api/agencies/prisons` }) as Promise<PrisonApiPrison[]>
  }

  async getPrisonsWithServiceCode(serviceCode: string): Promise<PrisonApiPrisonDetails[]> {
    return this.restClient.get({ path: `/api/service-prisons/${serviceCode}` }) as Promise<PrisonApiPrisonDetails[]>
  }

  async postServiceCodeForPrison(serviceCode: string, prisonId: string): Promise<PrisonApiPrisonDetails> {
    return this.restClient.post({
      path: `/api/service-prisons/${serviceCode}/prison/${prisonId}`,
    }) as Promise<PrisonApiPrisonDetails>
  }

  async deleteServiceCodeForPrison(serviceCode: string, prisonId: string): Promise<PrisonApiPrisonDetails> {
    return this.restClient.delete({
      path: `/api/service-prisons/${serviceCode}/prison/${prisonId}`,
    }) as Promise<PrisonApiPrisonDetails>
  }
}

import { Readable } from 'stream'
import type HmppsAuthClient from '../api/hmppsAuthClient'
import PrisonApiClient from '../api/prisonApiClient'
import {
  PrisonApiOffenderSentenceAndOffences,
  PrisonApiPrisoner,
  PrisonApiSentenceAdjustmentDetail,
  PrisonApiUserCaseloads,
} from '../@types/prisonApi/prisonClientTypes'
import PrisonerSearchApiClient from '../api/prisonerSearchApiClient'
import { Prisoner, PrisonerSearchCriteria } from '../@types/prisonerOffenderSearch/prisonerSearchClientTypes'

export default class PrisonerService {
  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {}

  async getPrisonerImage(username: string, nomsId: string): Promise<Readable> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    return new PrisonApiClient(token).getPrisonerImage(nomsId)
  }

  async getPrisonerDetail(username: string, nomsId: string, userCaseloads: string[]): Promise<PrisonApiPrisoner> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const prisonerDetail = await new PrisonApiClient(token).getPrisonerDetail(nomsId)
    if (!userCaseloads.includes(prisonerDetail.agencyId)) {
      const error = {
        status: 404,
        message: 'The prisoner details have not been found because the prisoner is not in your caseload',
      }
      throw error
    }
    return prisonerDetail
  }

  async searchPrisoners(username: string, prisonerSearchCriteria: PrisonerSearchCriteria): Promise<Prisoner[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    return new PrisonerSearchApiClient(token).searchPrisoners(prisonerSearchCriteria)
  }

  async getSentencesAndOffences(username: string, bookingId: number): Promise<PrisonApiOffenderSentenceAndOffences[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    return new PrisonApiClient(token).getSentencesAndOffences(bookingId)
  }

  async getSentenceAdjustments(username: string, bookingId: number): Promise<PrisonApiSentenceAdjustmentDetail> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    return new PrisonApiClient(token).getSentenceAdjustments(bookingId)
  }

  async getUsersCaseloads(username: string): Promise<PrisonApiUserCaseloads[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    return new PrisonApiClient(token).getUsersCaseloads()
  }
}

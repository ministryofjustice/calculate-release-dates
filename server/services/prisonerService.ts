import { Readable } from 'stream'
import type HmppsAuthClient from '../data/hmppsAuthClient'
import PrisonApiClient from '../api/prisonApiClient'
import {
  PrisonApiPrison,
  PrisonApiPrisonDetails,
  PrisonApiPrisoner,
  PrisonApiReturnToCustodyDate,
  PrisonApiUserCaseloads,
} from '../@types/prisonApi/prisonClientTypes'
import PrisonerSearchApiClient from '../api/prisonerSearchApiClient'
import { Prisoner, PrisonerSearchCriteria } from '../@types/prisonerOffenderSearch/prisonerSearchClientTypes'
import { FullPageError } from '../types/FullPageError'

export default class PrisonerService {
  private readonly includeReleased: boolean

  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {
    this.includeReleased = true
  }

  async getPrisonerImage(username: string, nomsId: string): Promise<Readable> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    return new PrisonApiClient(token).getPrisonerImage(nomsId)
  }

  async checkPrisonerAccess(nomsId: string, userCaseloads: string[], token: string) {
    return this.getPrisonerDetailImpl(nomsId, userCaseloads, token, this.includeReleased, false)
  }

  async getPrisonerDetail(nomsId: string, userCaseloads: string[], token: string): Promise<PrisonApiPrisoner> {
    return this.getPrisonerDetailImpl(nomsId, userCaseloads, token, this.includeReleased, false)
  }

  async getPrisonerDetailForSpecialistSupport(nomsId: string, token: string): Promise<PrisonApiPrisoner> {
    return this.getPrisonerDetailImpl(nomsId, [], token, this.includeReleased, true)
  }

  private async getPrisonerDetailImpl(
    nomsId: string,
    userCaseloads: string[],
    token: string,
    includeReleased: boolean,
    isSpecialistSupport: boolean,
  ): Promise<PrisonApiPrisoner> {
    try {
      const prisonerDetail = await new PrisonApiClient(token).getPrisonerDetail(nomsId)

      if (isSpecialistSupport || this.isAccessiblePrisoner(prisonerDetail.agencyId, userCaseloads, includeReleased)) {
        return prisonerDetail
      }

      throw FullPageError.notInCaseLoadError(prisonerDetail)
    } catch (error) {
      if (error?.status === 404 && !(error instanceof FullPageError)) {
        throw FullPageError.notInCaseLoadError()
      } else {
        throw error
      }
    }
  }

  private isAccessiblePrisoner(agencyId: string, caseload: string[], includeReleased: boolean): boolean {
    return caseload.includes(agencyId) || ['TRN'].includes(agencyId) || this.isReleased(agencyId, includeReleased)
  }

  private isReleased(agencyId: string, includeReleased: boolean): boolean {
    return includeReleased && ['OUT'].includes(agencyId)
  }

  async searchPrisoners(username: string, prisonerSearchCriteria: PrisonerSearchCriteria): Promise<Prisoner[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    return new PrisonerSearchApiClient(token).searchPrisoners(prisonerSearchCriteria)
  }

  async getUsersCaseloads(token: string): Promise<PrisonApiUserCaseloads[]> {
    return new PrisonApiClient(token).getUsersCaseloads()
  }

  async getReturnToCustodyDate(bookingId: number, token: string): Promise<PrisonApiReturnToCustodyDate> {
    const { returnToCustodyDate } = await new PrisonApiClient(token).getFixedTermRecallDetails(bookingId)
    return { bookingId, returnToCustodyDate } as PrisonApiReturnToCustodyDate
  }

  async getActivePrisons(token: string): Promise<PrisonApiPrison[]> {
    return new PrisonApiClient(token).getActivePrisons()
  }

  async getPrisonsWithServiceCode(serviceCode: string): Promise<PrisonApiPrisonDetails[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    return new PrisonApiClient(token).getPrisonsWithServiceCode(serviceCode)
  }

  async postServiceCodeForPrison(serviceCode: string, prisonId): Promise<PrisonApiPrisonDetails> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    return new PrisonApiClient(token).postServiceCodeForPrison(serviceCode, prisonId)
  }

  async deleteServiceCodeForPrison(serviceCode: string, prisonId): Promise<PrisonApiPrisonDetails> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    return new PrisonApiClient(token).deleteServiceCodeForPrison(serviceCode, prisonId)
  }
}

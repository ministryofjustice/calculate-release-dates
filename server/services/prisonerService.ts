import { Readable } from 'stream'
import type HmppsAuthClient from '../data/hmppsAuthClient'
import PrisonApiClient from '../api/prisonApiClient'
import PrisonerSearchApiClient from '../api/prisonerSearchApiClient'
import { FullPageError } from '../types/FullPageError'
import deriveAccessibleCaseloads from '../utils/caseloads'
import {
  PrisonApiPrisoner,
  PrisonApiReturnToCustodyDate,
  PrisonApiUserCaseloads,
} from '../@types/prisonApi/prisonClientTypes'
import { Prisoner, PrisonerSearchCriteria } from '../@types/prisonerOffenderSearch/prisonerSearchClientTypes'
import logger from '../../logger'

export default class PrisonerService {
  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {}

  private prisonApi(token: string): PrisonApiClient {
    return new PrisonApiClient(token)
  }

  async getPrisonerImage(username: string, nomsId: string): Promise<Readable> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    return this.prisonApi(token).getPrisonerImage(nomsId)
  }

  async getPrisonerDetail(
    nomsId: string,
    token: string,
    userCaseloads: string[],
    userRoles: string[],
  ): Promise<PrisonApiPrisoner> {
    return this.getAccessiblePrisoner(nomsId, token, userCaseloads, userRoles)
  }

  async checkPrisonerAccess(
    nomsId: string,
    token: string,
    userCaseloads: string[],
    userRoles: string[],
  ): Promise<PrisonApiPrisoner> {
    return this.getAccessiblePrisoner(nomsId, token, userCaseloads, userRoles)
  }

  async getPrisonerDetailForSpecialistSupport(nomsId: string, token: string): Promise<PrisonApiPrisoner> {
    return this.getPrisonerDetailImpl(nomsId, [], token, true)
  }

  private getAccessiblePrisoner(
    nomsId: string,
    token: string,
    userCaseloads: string[],
    userRoles: string[],
  ): Promise<PrisonApiPrisoner> {
    const accessibleCaseloads = deriveAccessibleCaseloads(userCaseloads, userRoles)
    return this.getPrisonerDetailImpl(nomsId, accessibleCaseloads, token)
  }

  private async getPrisonerDetailImpl(
    nomsId: string,
    accessibleCaseloads: string[],
    token: string,
    isSpecialistSupport = false,
  ): Promise<PrisonApiPrisoner> {
    try {
      const prisonerDetail = await this.prisonApi(token).getPrisonerDetail(nomsId)

      logger.info('Accessible caseloads:', accessibleCaseloads)
      logger.info('Prisoner agencyId:', prisonerDetail.agencyId)

      if (isSpecialistSupport || accessibleCaseloads.includes(prisonerDetail.agencyId)) {
        return prisonerDetail
      }

      throw FullPageError.notInCaseLoadError(prisonerDetail)
    } catch (error) {
      if (error?.status === 404 && !(error instanceof FullPageError)) {
        throw FullPageError.notInCaseLoadError()
      }
      throw error
    }
  }

  async searchPrisoners(username: string, criteria: PrisonerSearchCriteria): Promise<Prisoner[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    return new PrisonerSearchApiClient(token).searchPrisoners(criteria)
  }

  async getUsersCaseloads(token: string): Promise<PrisonApiUserCaseloads[]> {
    return this.prisonApi(token).getUsersCaseloads()
  }

  async getReturnToCustodyDate(bookingId: number, token: string): Promise<PrisonApiReturnToCustodyDate> {
    const { returnToCustodyDate } = await this.prisonApi(token).getFixedTermRecallDetails(bookingId)
    return { bookingId, returnToCustodyDate }
  }
}

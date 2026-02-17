import { Readable } from 'stream'
import PrisonApiClient from '../data/prisonApiClient'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
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
  constructor(
    private readonly prisonerSearchApiClient: PrisonerSearchApiClient,
    private readonly prisonApiClient: PrisonApiClient,
  ) {}

  async getPrisonerImage(username: string, nomsId: string): Promise<Readable> {
    return this.prisonApiClient.getPrisonerImage(nomsId, username)
  }

  async getPrisonerDetail(
    nomsId: string,
    username: string,
    userCaseloads: string[],
    userRoles: string[],
  ): Promise<PrisonApiPrisoner> {
    return this.getAccessiblePrisoner(nomsId, username, userCaseloads, userRoles)
  }

  async checkPrisonerAccess(
    nomsId: string,
    username: string,
    userCaseloads: string[],
    userRoles: string[],
  ): Promise<PrisonApiPrisoner> {
    return this.getAccessiblePrisoner(nomsId, username, userCaseloads, userRoles)
  }

  private getAccessiblePrisoner(
    nomsId: string,
    username: string,
    userCaseloads: string[],
    userRoles: string[],
  ): Promise<PrisonApiPrisoner> {
    const accessibleCaseloads = deriveAccessibleCaseloads(userCaseloads, userRoles)
    return this.getPrisonerDetailImpl(nomsId, username, accessibleCaseloads)
  }

  private async getPrisonerDetailImpl(
    nomsId: string,
    username: string,
    accessibleCaseloads: string[],
  ): Promise<PrisonApiPrisoner> {
    try {
      const prisonerDetail = await this.prisonApiClient.getPrisonerDetail(nomsId, username)

      logger.info('Accessible caseloads:', accessibleCaseloads)
      logger.info('Prisoner agencyId:', prisonerDetail.agencyId)

      if (accessibleCaseloads.includes(prisonerDetail.agencyId)) {
        return prisonerDetail
      }

      throw FullPageError.notInCaseLoadError(prisonerDetail)
    } catch (error) {
      if (error?.responseStatus === 404 && !(error instanceof FullPageError)) {
        throw FullPageError.notInCaseLoadError()
      }
      throw error
    }
  }

  async searchPrisoners(username: string, criteria: PrisonerSearchCriteria): Promise<Prisoner[]> {
    return this.prisonerSearchApiClient.searchPrisoners(username, criteria)
  }

  async getUsersCaseloads(token: string): Promise<PrisonApiUserCaseloads[]> {
    return this.prisonApiClient.getUsersCaseloads(token)
  }

  async getReturnToCustodyDate(bookingId: number, username: string): Promise<PrisonApiReturnToCustodyDate> {
    const { returnToCustodyDate } = await this.prisonApiClient.getFixedTermRecallDetails(bookingId, username)
    return { bookingId, returnToCustodyDate }
  }
}

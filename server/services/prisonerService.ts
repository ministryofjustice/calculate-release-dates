import { Readable } from 'stream'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import PrisonApiClient from '../data/prisonApiClient'
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
  constructor(
    private readonly hmppsAuthClient: AuthenticationClient,
    private readonly prisonApiClient: PrisonApiClient,
  ) {}

  async getPrisonerImage(username: string, nomsId: string): Promise<Readable> {
    return this.prisonApiClient.getPrisonerImage(nomsId, username)
  }

  async getPrisonerDetail(nomsId: string, userCaseloads: string[], userRoles: string[]): Promise<PrisonApiPrisoner> {
    return this.getAccessiblePrisoner(nomsId, userCaseloads, userRoles)
  }

  async checkPrisonerAccess(nomsId: string, userCaseloads: string[], userRoles: string[]): Promise<PrisonApiPrisoner> {
    return this.getAccessiblePrisoner(nomsId, userCaseloads, userRoles)
  }

  private getAccessiblePrisoner(
    nomsId: string,
    userCaseloads: string[],
    userRoles: string[],
  ): Promise<PrisonApiPrisoner> {
    const accessibleCaseloads = deriveAccessibleCaseloads(userCaseloads, userRoles)
    return this.getPrisonerDetailImpl(nomsId, accessibleCaseloads)
  }

  private async getPrisonerDetailImpl(
    nomsId: string,
    accessibleCaseloads: string[],
    isSpecialistSupport = false,
  ): Promise<PrisonApiPrisoner> {
    try {
      const prisonerDetail = await this.prisonApiClient.getPrisonerDetail(nomsId)

      logger.info('Accessible caseloads:', accessibleCaseloads)
      logger.info('Prisoner agencyId:', prisonerDetail.agencyId)

      if (isSpecialistSupport || accessibleCaseloads.includes(prisonerDetail.agencyId)) {
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
    const token = await this.hmppsAuthClient.getToken(username)
    return new PrisonerSearchApiClient(token).searchPrisoners(criteria)
  }

  async getUsersCaseloads(token: string): Promise<PrisonApiUserCaseloads[]> {
    return this.prisonApiClient.getUsersCaseloads(token)
  }

  async getReturnToCustodyDate(bookingId: number): Promise<PrisonApiReturnToCustodyDate> {
    const { returnToCustodyDate } = await this.prisonApiClient.getFixedTermRecallDetails(bookingId)
    return { bookingId, returnToCustodyDate }
  }
}

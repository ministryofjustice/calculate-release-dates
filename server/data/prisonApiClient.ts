import { Readable } from 'stream'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { asSystem, asUser, RestClient } from '@ministryofjustice/hmpps-rest-client'
import config from '../config'
import type {
  PrisonApiFixedTermRecallDetails,
  PrisonApiPrisoner,
  PrisonApiUserCaseloads,
} from '../@types/prisonApi/prisonClientTypes'
import logger from '../../logger'

export default class PrisonApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Prison API', config.apis.prisonApi, logger, authenticationClient)
  }

  async getPrisonerImage(nomsId: string, username: string): Promise<Readable> {
    return this.stream<Readable>({ path: `/api/bookings/offenderNo/${nomsId}/image/data` }, asSystem(username))
  }

  async getPrisonerDetail(nomsId: string, username: string): Promise<PrisonApiPrisoner> {
    return this.get<PrisonApiPrisoner>({ path: `/api/offenders/${nomsId}` }, asSystem(username))
  }

  async getUsersCaseloads(token: string): Promise<PrisonApiUserCaseloads[]> {
    return this.get<PrisonApiUserCaseloads[]>({ path: `/api/users/me/caseLoads` }, asUser(token))
  }

  async getFixedTermRecallDetails(bookingId: number, username: string): Promise<PrisonApiFixedTermRecallDetails> {
    return this.get<PrisonApiFixedTermRecallDetails>(
      {
        path: `/api/bookings/${bookingId}/fixed-term-recall`,
      },
      asSystem(username),
    )
  }
}

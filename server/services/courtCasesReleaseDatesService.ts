import CourtCasesReleaseDatesApiClient from '../api/courtCasesReleaseDatesApiClient'
import { CcrdServiceDefinitions } from '../@types/courtCasesReleaseDatesApi/types'

export default class CourtCasesReleaseDatesService {
  constructor() {}

  public async getServiceDefinitions(prisonerId: string, token: string): Promise<CcrdServiceDefinitions> {
    return new CourtCasesReleaseDatesApiClient(token).getServiceDefinitions(prisonerId)
  }
}

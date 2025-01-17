import { HmppsAuthClient } from '../data'
import CourtCasesReleaseDatesApiClient from '../api/courtCasesReleaseDatesApiClient'
import { ThingsToDo } from '../@types/courtCasesReleaseDatesApi/types'

export default class CourtCasesReleaseDatesService {
  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {}

  public async getThingsToDo(prisonerId: string): Promise<ThingsToDo> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    return new CourtCasesReleaseDatesApiClient(token).getThingsToDoForPrisoner(prisonerId)
  }
}

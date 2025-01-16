import { ThingsToDo } from '../@types/courtCasesReleaseDatesApi/types'
import config, { ApiConfig } from '../config'
import RestClient from '../data/restClient'

export default class CourtCasesReleaseDatesApiClient {
  restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient(
      'Court Cases Release Dates API',
      config.apis.courtCasesReleaseDatesApi as ApiConfig,
      token,
    )
  }

  getThingsToDoForPrisoner(prisonerId: string): Promise<ThingsToDo> {
    return this.restClient.get({ path: `/things-to-do/prisoner/${prisonerId}` }) as Promise<ThingsToDo>
  }
}

import { RequestHandler } from 'express'
import PrisonerService from '../services/prisonerService'
import CourtCasesReleaseDatesService from '../services/courtCasesReleaseDatesService'
import ThingsToDoInterceptViewModel from '../models/ThingsToDoInterceptViewModel'

export default class ThingsToDoInterceptRoutes {
  constructor(
    private readonly prisonerService: PrisonerService,
    private readonly courtCasesReleaseDatesService: CourtCasesReleaseDatesService,
  ) {
    // intentionally left blank
  }

  public thingsToDoIntercept: RequestHandler = async (req, res): Promise<void> => {
    const { token, caseloads, userRoles } = res.locals.user
    const { nomsId } = req.params

    const serviceDefinitions = await this.courtCasesReleaseDatesService.getServiceDefinitions(nomsId, token)

    const thingsToDo = Object.keys(serviceDefinitions.services)
      .filter(it => it !== 'releaseDates')
      .map(it => serviceDefinitions.services[it].thingsToDo)
      .filter(it => it.count > 0)
      .flatMap(it => it.things)

    if (!thingsToDo.length) {
      return res.redirect(`/?prisonId=${nomsId}`)
    }
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, userRoles)

    return res.render(
      'pages/calculation/thingsToDoIntercept',
      new ThingsToDoInterceptViewModel(prisonerDetail, thingsToDo),
    )
  }
}

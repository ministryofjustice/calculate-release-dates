import { Request, Response } from 'express'
import { Controller } from '../controller'
import PrisonerService from '../../services/prisonerService'
import CourtCasesReleaseDatesService from '../../services/courtCasesReleaseDatesService'
import ThingsToDoInterceptViewModel from '../../models/ThingsToDoInterceptViewModel'

export default class ThingsToDoInterceptController implements Controller {
  constructor(
    private readonly prisonerService: PrisonerService,
    private readonly courtCasesReleaseDatesService: CourtCasesReleaseDatesService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { token } = res.locals.user
    const { nomsId } = req.params

    const serviceDefinitions = await this.courtCasesReleaseDatesService.getServiceDefinitions(nomsId, token)

    const thingsToDo = Object.keys(serviceDefinitions.services)
      .filter(it => it !== 'releaseDates')
      .map(it => serviceDefinitions.services[it].thingsToDo)
      .filter(it => it.count > 0)
      .flatMap(it => it.things)

    if (!thingsToDo.length) {
      res.redirect(`/?prisonId=${nomsId}`)
      return
    }

    const prisonerDetail = req.prisoner

    res.render('pages/calculation/thingsToDoIntercept', new ThingsToDoInterceptViewModel(prisonerDetail, thingsToDo))
  }
}

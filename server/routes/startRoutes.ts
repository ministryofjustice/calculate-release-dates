import { RequestHandler } from 'express'
import EntryPointService from '../services/entryPointService'
import PrisonerService from '../services/prisonerService'
import config from '../config'

export default class StartRoutes {
  constructor(
    private readonly entryPointService: EntryPointService,
    private readonly prisonerService: PrisonerService
  ) {}

  public startPage: RequestHandler = async (req, res): Promise<void> => {
    const { prisonId } = req.query as Record<string, string>
    if (prisonId) {
      this.entryPointService.setDpsEntrypointCookie(res, prisonId)
      const { username, caseloads, token } = res.locals.user
      const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, prisonId, caseloads, token)
      return res.render('pages/index', { prisonId, prisonerDetail })
    }
    this.entryPointService.setStandaloneEntrypointCookie(res)
    return res.render('pages/index', { prisonId })
  }

  public supportedSentences: RequestHandler = async (req, res): Promise<void> => {
    let prisonId: string
    if (this.entryPointService.isDpsEntryPoint(req)) {
      prisonId = this.entryPointService.getDpsPrisonerId(req)
    }
    return res.render('pages/supportedSentences', { prisonId })
  }
}

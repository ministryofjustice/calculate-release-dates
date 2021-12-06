import { RequestHandler } from 'express'
import EntryPointService from '../services/entryPointService'

export default class StartRoutes {
  constructor(private readonly entryPointService: EntryPointService) {}

  public startPage: RequestHandler = async (req, res): Promise<void> => {
    const { prisonId } = req.query as Record<string, string>
    if (prisonId) {
      this.entryPointService.setDpsEntrypointCookie(res, prisonId)
    } else {
      this.entryPointService.setStandaloneEntrypointCookie(res)
    }
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

import { RequestHandler } from 'express'
import EntryPointService from '../services/entrypointService'

export default class StartRoutes {
  constructor(private readonly entrypointService: EntryPointService) {}

  public startPage: RequestHandler = async (req, res): Promise<void> => {
    const { prisonId } = req.query as Record<string, string>
    if (prisonId) {
      this.entrypointService.setDpsEntrypointCookie(res)
    } else {
      this.entrypointService.setStandaloneEntrypointCookie(res)
    }
    return res.render('pages/index', { prisonId })
  }
}

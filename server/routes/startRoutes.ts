import { RequestHandler } from 'express'
import EntryPointService from '../services/entryPointService'

export default class StartRoutes {
  constructor(private readonly entryPointService: EntryPointService) {}

  public startPage: RequestHandler = async (req, res): Promise<void> => {
    const { prisonId } = req.query as Record<string, string>
    if (prisonId) {
      this.entryPointService.setDpsEntrypointCookie(res)
    } else {
      this.entryPointService.setStandaloneEntrypointCookie(res)
    }
    return res.render('pages/index', { prisonId })
  }
}

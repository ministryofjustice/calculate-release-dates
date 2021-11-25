import { Request, Response } from 'express'
import convertToTitleCase from '../utils/utils'
import type HmppsAuthClient from '../api/hmppsAuthClient'
import PrisonApiClient from '../api/prisonApiClient'

export default class EntryPointService {
  private readonly START_COOKIE_NAME = 'CRD_ENTRY_POINT'

  private readonly DPS_START = 'DPS'

  private readonly STANDALONE_START = 'STANDALONE'

  public setDpsEntrypointCookie(res: Response) {
    res.cookie(this.START_COOKIE_NAME, this.DPS_START)
  }

  public setStandaloneEntrypointCookie(res: Response) {
    res.cookie(this.START_COOKIE_NAME, this.STANDALONE_START)
  }

  public isDpsEntryPoint(req: Request): boolean {
    return req.cookies[this.START_COOKIE_NAME] === this.DPS_START
  }

  public clearEntryPoint(res: Response) {
    res.clearCookie(this.START_COOKIE_NAME)
  }
}

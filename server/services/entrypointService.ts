import { Request, Response } from 'express'

export default class EntryPointService {
  private readonly START_COOKIE_NAME = 'CRD_ENTRY_POINT'

  private readonly DPS_START = 'DPS'

  private readonly STANDALONE_START = 'STANDALONE'

  public setDpsEntrypointCookie(res: Response): void {
    res.cookie(this.START_COOKIE_NAME, this.DPS_START)
  }

  public setStandaloneEntrypointCookie(res: Response): void {
    res.cookie(this.START_COOKIE_NAME, this.STANDALONE_START)
  }

  public isDpsEntryPoint(req: Request): boolean {
    return req.cookies[this.START_COOKIE_NAME] === this.DPS_START
  }

  public clearEntryPoint(res: Response): void {
    res.clearCookie(this.START_COOKIE_NAME)
  }
}

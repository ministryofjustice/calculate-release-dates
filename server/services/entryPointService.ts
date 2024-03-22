import { Request, Response } from 'express'

export default class EntryPointService {
  private readonly START_COOKIE_NAME = 'CRD_ENTRY_POINT'

  private readonly DPS_PRISONER_ID_COOKIE_NAME = 'DPS_ENTRY_PRISONER_ID'

  private readonly DPS_START = 'DPS'

  private readonly STANDALONE_START = 'STANDALONE'

  private readonly SUPPORT_EMAIL = 'SUPPORT_EMAIL'

  private readonly SUPPORT_CALCULATION_ID = 'SUPPORT_CALCULATION_ID'

  public setDpsEntrypointCookie(res: Response, prisonId: string): void {
    res.cookie(this.START_COOKIE_NAME, this.DPS_START)
    res.cookie(this.DPS_PRISONER_ID_COOKIE_NAME, prisonId)
  }

  public setStandaloneEntrypointCookie(res: Response): void {
    res.cookie(this.START_COOKIE_NAME, this.STANDALONE_START)
    res.clearCookie(this.DPS_PRISONER_ID_COOKIE_NAME)
  }

  public isDpsEntryPoint(req: Request): boolean {
    // Default behaviour to DPS.
    const cookieUnset = !req.cookies[this.START_COOKIE_NAME]
    return cookieUnset || req.cookies[this.START_COOKIE_NAME] === this.DPS_START
  }

  public getDpsPrisonerId(req: Request): string {
    if (this.isDpsEntryPoint(req)) {
      return req.cookies[this.DPS_PRISONER_ID_COOKIE_NAME]
    }
    return null
  }

  public clearEntryPoint(res: Response): void {
    res.clearCookie(this.START_COOKIE_NAME)
    res.clearCookie(this.DPS_PRISONER_ID_COOKIE_NAME)
  }

  public setEmailEntryPoint(res: Response, calculationId: string): void {
    res.cookie(this.START_COOKIE_NAME, this.SUPPORT_EMAIL)
    res.cookie(this.SUPPORT_CALCULATION_ID, calculationId)
  }
}

import { Request, Response } from 'express'
import { Controller } from '../controller'
import config from '../../config'

export default class AccessibilityController implements Controller {
  GET = async (_req: Request, res: Response): Promise<void> => {
    const ccardAccessibility = `${config.apis.courtCasesAndReleaseDatesUi.url}/accessibility`
    return res.redirect(ccardAccessibility)
  }
}

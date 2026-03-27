import { Request, Response } from 'express'
import { Controller } from '../controller'

export default class CompareManualCalculationController implements Controller {
  GET = async (_req: Request, res: Response): Promise<void> => {
    res.render('pages/compare/manual')
  }
}

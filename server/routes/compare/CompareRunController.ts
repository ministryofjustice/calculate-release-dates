import { Request, Response } from 'express'
import { Controller } from '../controller'
import ComparisonService from '../../services/comparisonService'

export default class CompareRunController implements Controller {
  constructor(private readonly comparisonService: ComparisonService) {}

  POST = async (req: Request, res: Response): Promise<void> => {
    const { selectedOMU, comparisonType } = req.body
    const { username } = res.locals.user

    const comparison = await this.comparisonService.createPrisonComparison(username, selectedOMU, comparisonType)

    res.redirect(`/compare/result/${comparison.comparisonShortReference}`)
  }
}

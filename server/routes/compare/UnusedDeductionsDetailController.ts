import { Request, Response } from 'express'
import { Controller } from '../controller'
import ComparisonService from '../../services/comparisonService'

export default class UnusedDeductionsDetailController implements Controller {
  constructor(private readonly comparisonService: ComparisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { comparisonId, personId } = req.params
    const detail = await this.comparisonService.getUnusedDeductionsComparisonPerson(
      comparisonId,
      personId,
      res.locals.user.username,
    )
    res.render('pages/compare/unusedDeductions/detail', { detail, comparison: detail.comparison })
  }
}

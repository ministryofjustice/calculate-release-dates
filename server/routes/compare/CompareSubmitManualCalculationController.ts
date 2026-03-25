import { Request, Response } from 'express'
import { Controller } from '../controller'
import ComparisonService from '../../services/comparisonService'

export default class CompareSubmitManualCalculationController implements Controller {
  constructor(private readonly comparisonService: ComparisonService) {}

  POST = async (req: Request, res: Response): Promise<void> => {
    const { username } = res.locals.user
    const { prisonerIds } = req.body

    const nomsIds = (prisonerIds as string).split(/\r?\n/)
    const comparison = await this.comparisonService.createManualComparison(nomsIds, username)

    res.redirect(`/compare/manual/result/${comparison.comparisonShortReference}`)
  }
}

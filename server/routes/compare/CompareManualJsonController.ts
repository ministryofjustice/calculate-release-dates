import { Request, Response } from 'express'
import { Controller } from '../controller'
import ComparisonService from '../../services/comparisonService'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import ComparisonResultMismatchDetailModel from '../../models/ComparisonResultMismatchDetailModel'

export default class CompareManualJsonController implements Controller {
  constructor(
    private readonly comparisonService: ComparisonService,
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { bulkComparisonResultId, bulkComparisonDetailId } = req.params
    const { username } = res.locals.user

    const comparisonMismatch = await this.comparisonService.getManualMismatchComparison(
      bulkComparisonResultId,
      bulkComparisonDetailId,
      username,
    )
    const jsonData = await this.calculateReleaseDatesService.getPersonComparisonInputData(
      username,
      bulkComparisonResultId,
      bulkComparisonDetailId,
    )

    res.render('pages/compare/resultJson', {
      bulkComparisonResultId,
      bulkComparisonDetailId,
      bulkComparison: new ComparisonResultMismatchDetailModel(comparisonMismatch),
      jsonData,
      isManual: true,
    })
  }
}

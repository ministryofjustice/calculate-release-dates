import { Request, Response } from 'express'
import { Controller } from '../controller'
import UserPermissionsService from '../../services/userPermissionsService'
import ComparisonService from '../../services/comparisonService'
import ComparisonResultOverviewModel from '../../models/ComparisonResultOverviewModel'

export default class CompareResultController implements Controller {
  constructor(
    private readonly userPermissionsService: UserPermissionsService,
    private readonly comparisonService: ComparisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { bulkComparisonResultId } = req.params
    const { username, userRoles, caseloadMap } = res.locals.user

    const comparison = await this.comparisonService.getPrisonComparison(bulkComparisonResultId, username)
    const allowBulkComparison = this.userPermissionsService.allowBulkComparison(userRoles)
    const overviewModel = new ComparisonResultOverviewModel(comparison, caseloadMap)

    res.render('pages/compare/resultOverview', {
      allowBulkComparison,
      comparison: overviewModel,
      bulkComparisonResultId,
    })
  }
}

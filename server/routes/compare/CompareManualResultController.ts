import { Request, Response } from 'express'
import { Controller } from '../controller'
import UserPermissionsService from '../../services/userPermissionsService'
import ComparisonService from '../../services/comparisonService'
import ComparisonResultOverviewModel from '../../models/ComparisonResultOverviewModel'

export default class CompareManualResultController implements Controller {
  constructor(
    private readonly userPermissionsService: UserPermissionsService,
    private readonly comparisonService: ComparisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { bulkComparisonResultId } = req.params
    const { username, userRoles, caseloadMap } = res.locals.user

    const comparison = await this.comparisonService.getManualComparison(bulkComparisonResultId, username)
    const allowManualComparison = this.userPermissionsService.allowManualComparison(userRoles)

    res.render('pages/compare/manualResultOverview', {
      allowManualComparison,
      comparison: new ComparisonResultOverviewModel(comparison, caseloadMap),
      bulkComparisonResultId,
    })
  }
}

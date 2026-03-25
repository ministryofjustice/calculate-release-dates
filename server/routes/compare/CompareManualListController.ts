import { Request, Response } from 'express'
import { Controller } from '../controller'
import UserPermissionsService from '../../services/userPermissionsService'
import ComparisonService from '../../services/comparisonService'
import ListComparisonViewModel from '../../models/ListComparisonViewModel'

export default class CompareManualListController implements Controller {
  constructor(
    private readonly userPermissionsService: UserPermissionsService,
    private readonly comparisonService: ComparisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { userRoles, caseloadMap, username } = res.locals.user
    const allowBulkComparison = this.userPermissionsService.allowBulkComparison(userRoles)
    const manualComparisons = await this.comparisonService.getManualComparisons(username)
    const comparisons = manualComparisons.map(comparison => new ListComparisonViewModel(comparison, caseloadMap))

    const sortedComparisons = Array.from(comparisons).sort(
      (a, b) => new Date(b.calculatedAt).valueOf() - new Date(a.calculatedAt).valueOf(),
    )

    const userComparisons = sortedComparisons.filter(comparison => comparison.calculatedBy === username)
    const otherComparisons = sortedComparisons.filter(comparison => comparison.calculatedBy !== username)

    res.render('pages/compare/manualList', {
      allowBulkComparison,
      otherComparisons,
      userComparisons,
    })
  }
}

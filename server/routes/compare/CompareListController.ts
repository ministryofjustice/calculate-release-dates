import { Request, Response } from 'express'
import { Controller } from '../controller'
import UserPermissionsService from '../../services/userPermissionsService'
import ComparisonService from '../../services/comparisonService'
import ListComparisonViewModel from '../../models/ListComparisonViewModel'

export default class CompareListController implements Controller {
  constructor(
    private readonly userPermissionsService: UserPermissionsService,
    private readonly comparisonService: ComparisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { userRoles, caseloadMap, username } = res.locals.user
    const allowBulkComparison = this.userPermissionsService.allowBulkComparison(userRoles)
    const prisonComparisons = await this.comparisonService.getPrisonComparisons(username)
    const comparisons = prisonComparisons.map(comparison => new ListComparisonViewModel(comparison, caseloadMap))

    let sortedComparisons = Array.from(comparisons).sort(
      (a, b) => new Date(b.calculatedAt).valueOf() - new Date(a.calculatedAt).valueOf(),
    )

    const inputPrison = req.query.prisonName as string | undefined

    if (inputPrison) {
      sortedComparisons = sortedComparisons.filter(comparison => comparison.prisonName === inputPrison)
    }

    const prisonsArray = [...new Set(comparisons.map(comparison => comparison.prisonName))]
    const prisons = prisonsArray.map(prisonString => ({
      value: prisonString,
      text: prisonString,
      selected: prisonString === inputPrison,
    }))
    prisons.unshift({ text: '', value: '', selected: false })

    const userComparisons = sortedComparisons.filter(comparison => comparison.calculatedBy === username)
    const otherComparisons = sortedComparisons.filter(comparison => comparison.calculatedBy !== username)

    res.render('pages/compare/list', {
      allowBulkComparison,
      otherComparisons,
      userComparisons,
      prisons,
    })
  }
}

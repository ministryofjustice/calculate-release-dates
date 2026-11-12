import { Request, Response } from 'express'
import { Controller } from '../controller'
import ComparisonService from '../../services/comparisonService'
import config from '../../config'
import buildPagination, { parsePage } from '../../utils/paginationUtils'

export type UnusedDeductionsListScope = 'your' | 'others'

export default class UnusedDeductionsListController implements Controller {
  constructor(
    private readonly comparisonService: ComparisonService,
    private readonly scope: UnusedDeductionsListScope,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { pageSize } = config.unusedDeductionsList
    const comparisonPage = await this.comparisonService.getUnusedDeductionsComparisons(
      parsePage(req.query.page) - 1,
      pageSize,
      res.locals.user.username,
      this.scope === 'your',
    )
    const basePath =
      this.scope === 'your' ? '/compare/unused-deductions/list' : '/compare/unused-deductions/list/others'
    const pagination = buildPagination({
      currentPage: comparisonPage.page.number + 1,
      totalPages: comparisonPage.page.totalPages,
      pageSize: comparisonPage.page.size,
      totalElements: comparisonPage.page.totalElements,
      hrefFor: page => `${basePath}?page=${page}`,
      text: 'runs',
    })
    res.render('pages/compare/unusedDeductions/list', {
      comparisons: comparisonPage.content,
      pagination,
      scope: this.scope,
    })
  }
}

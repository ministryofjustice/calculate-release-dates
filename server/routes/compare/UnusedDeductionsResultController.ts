import { Request, Response } from 'express'
import { Controller } from '../controller'
import buildPagination, { parsePage } from '../../utils/paginationUtils'
import config from '../../config'
import ComparisonService from '../../services/comparisonService'

const OUTCOMES = [
  { value: 'MISMATCH', text: 'Mismatch' },
  { value: 'VALIDATION_ERROR', text: 'Validation error' },
  { value: 'FATAL_ERROR', text: 'Failed' },
  { value: 'MATCH', text: 'Match' },
]

export default class UnusedDeductionsResultController implements Controller {
  constructor(private readonly comparisonService: ComparisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { comparisonId } = req.params
    const { pageSize } = config.unusedDeductionsResults
    // No outcome param defaults to mismatches; an explicit empty value means all outcomes
    const outcomeParam = req.query.outcome === undefined ? 'MISMATCH' : req.query.outcome
    const outcome = OUTCOMES.find(o => o.value === outcomeParam)?.value
    const prisonerId = typeof req.query.prisonerId === 'string' ? req.query.prisonerId.trim() || undefined : undefined
    const requestedPage = parsePage(req.query.page)
    const overview = await this.comparisonService.getUnusedDeductionsComparison(
      comparisonId,
      { outcome, prisonerId, page: requestedPage - 1, size: pageSize },
      res.locals.user.username,
    )

    const hrefFor = (target: number) => {
      const query = new URLSearchParams()
      query.set('outcome', outcome ?? '')
      if (prisonerId) query.set('prisonerId', prisonerId)
      query.set('page', `${target}`)
      return `/compare/unused-deductions/result/${comparisonId}?${query.toString()}`
    }
    const pagination = buildPagination({
      currentPage: overview.page.number + 1,
      totalPages: overview.page.totalPages,
      pageSize: overview.page.size,
      totalElements: overview.page.totalElements,
      hrefFor,
      text: 'people',
    })

    res.render('pages/compare/unusedDeductions/result', {
      overview,
      comparison: overview.comparison,
      filters: { outcome, prisonerId },
      defaultMismatchView: req.query.outcome === undefined && !prisonerId,
      outcomeItems: [{ value: '', text: 'All outcomes' }, ...OUTCOMES],
      pagination,
    })
  }
}

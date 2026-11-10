import { Request, Response } from 'express'
import { Controller } from '../controller'
import UserPermissionsService from '../../services/userPermissionsService'
import ComparisonService from '../../services/comparisonService'
import PrisonerService from '../../services/prisonerService'
import ListComparisonViewModel from '../../models/ListComparisonViewModel'
import config from '../../config'
import buildPagination, { parsePage } from '../../utils/paginationUtils'

export type CompareListScope = 'your' | 'others'

const ALL_PRISONS_VALUE = 'all'
const ALL_COMPARISONS_VALUE = 'allcomp'

export default class CompareListController implements Controller {
  constructor(
    private readonly userPermissionsService: UserPermissionsService,
    private readonly comparisonService: ComparisonService,
    private readonly prisonerService: PrisonerService,
    private readonly scope: CompareListScope,
  ) {}

  private basePath(): string {
    return this.scope === 'your' ? '/compare/list' : '/compare/list/others'
  }

  private buildHref(prisonCode: string | undefined, page: number): string {
    const params = new URLSearchParams()
    if (prisonCode) {
      params.set('prisonName', prisonCode)
    }
    params.set('page', page.toString())
    return `${this.basePath()}?${params.toString()}`
  }

  GET = async (req: Request, res: Response): Promise<void> => {
    const { userRoles, caseloadMap, username, token } = res.locals.user
    const allowBulkComparison = this.userPermissionsService.allowBulkComparison(userRoles)
    const calculatedByCurrentUser = this.scope === 'your'

    const inputPrison = req.query.prisonName as string | undefined
    const requestedPage = parsePage(req.query.page)
    const { pageSize } = config.compareList
    const searchPrison = inputPrison ?? ''

    const [pageResult, usersCaseload] = await Promise.all([
      this.comparisonService.searchComparisons(
        searchPrison === ALL_COMPARISONS_VALUE ? '' : searchPrison,
        calculatedByCurrentUser,
        requestedPage - 1,
        pageSize,
        username,
      ),
      this.prisonerService.getUsersCaseloads(token),
    ])

    const comparisons = (pageResult.content ?? []).map(
      comparison => new ListComparisonViewModel(comparison, caseloadMap),
    )

    const prisons = usersCaseload
      .map(caseload => ({
        value: caseload.caseLoadId,
        text: caseload.description ?? caseload.caseLoadId,
        selected: caseload.caseLoadId === inputPrison,
      }))
      .concat({
        value: ALL_PRISONS_VALUE,
        text: 'All prisons',
        selected: inputPrison === ALL_PRISONS_VALUE,
      })
      .concat({
        value: ALL_COMPARISONS_VALUE,
        text: 'All comparisons',
        selected: inputPrison === ALL_COMPARISONS_VALUE || inputPrison === undefined,
      })
    prisons.sort((a, b) => a.text.localeCompare(b.text))

    const totalPages = pageResult.page?.totalPages ?? 0
    const pageNumber = pageResult.page?.number ?? 0
    const currentPage = pageNumber + 1
    const pagination = buildPagination({
      currentPage,
      totalPages,
      pageSize,
      totalElements: pageResult.page?.totalElements ?? 0,
      hrefFor: page => this.buildHref(inputPrison, page),
      text: 'comparisons',
    })

    res.render('pages/compare/list', {
      allowBulkComparison,
      comparisons,
      prisons,
      scope: this.scope,
      pagination,
    })
  }
}

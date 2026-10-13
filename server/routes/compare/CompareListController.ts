import { Request, Response } from 'express'
import { Controller } from '../controller'
import UserPermissionsService from '../../services/userPermissionsService'
import ComparisonService from '../../services/comparisonService'
import PrisonerService from '../../services/prisonerService'
import ListComparisonViewModel from '../../models/ListComparisonViewModel'
import config from '../../config'

export type CompareListScope = 'your' | 'others'

const ALL_PRISONS_VALUE = 'all'
const ALL_COMPARISONS_VALUE = 'allcomp'

interface PaginationItem {
  text?: string
  href?: string
  selected?: boolean
  type?: string
}

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

  private buildPaginationItems(
    currentPage: number,
    totalPages: number,
    prisonCode: string | undefined,
  ): PaginationItem[] {
    if (totalPages <= 1) {
      return []
    }

    const pagesToShow = new Set<number>([1, totalPages, currentPage])
    if (currentPage - 1 >= 1) pagesToShow.add(currentPage - 1)
    if (currentPage + 1 <= totalPages) pagesToShow.add(currentPage + 1)
    const sortedPages = [...pagesToShow].sort((a, b) => a - b)

    const items: PaginationItem[] = []
    let previousPage = 0
    sortedPages.forEach(pageNum => {
      if (pageNum - previousPage > 1) {
        items.push({ type: 'dots' })
      }
      items.push({
        text: pageNum.toString(),
        href: this.buildHref(prisonCode, pageNum),
        selected: pageNum === currentPage,
      })
      previousPage = pageNum
    })
    return items
  }

  GET = async (req: Request, res: Response): Promise<void> => {
    const { userRoles, caseloadMap, username, token } = res.locals.user
    const allowBulkComparison = this.userPermissionsService.allowBulkComparison(userRoles)
    const calculatedByCurrentUser = this.scope === 'your'

    const inputPrison = req.query.prisonName as string | undefined
    const requestedPage = Number(req.query.page) || 1
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
    const numberOfElements = pageResult.content?.length ?? 0
    const from = numberOfElements > 0 ? pageNumber * pageSize + 1 : 0
    const to = from + numberOfElements - 1

    const pagination = {
      items: this.buildPaginationItems(currentPage, totalPages, inputPrison),
      previous: currentPage > 1 ? { href: this.buildHref(inputPrison, currentPage - 1), text: 'Previous' } : undefined,
      next: currentPage < totalPages ? { href: this.buildHref(inputPrison, currentPage + 1), text: 'Next' } : undefined,
      results: {
        from,
        to,
        count: pageResult.page?.totalElements ?? 0,
        text: 'comparisons',
      },
    }

    res.render('pages/compare/list', {
      allowBulkComparison,
      comparisons,
      prisons,
      scope: this.scope,
      pagination,
    })
  }
}

import { RequestHandler } from 'express'
import logger from '../../logger'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import UserPermissionsService from '../services/userPermissionsService'
import PrisonerService from '../services/prisonerService'
import ComparisonService from '../services/comparisonService'
import ListComparisonViewModel from '../models/ListComparisonViewModel'
import ComparisonResultOverviewModel from '../models/ComparisonResultOverviewModel'
import ComparisonResultMismatchDetailModel from '../models/ComparisonResultMismatchDetailModel'

export const comparePaths = {
  COMPARE_INDEX: '/compare',
  COMPARE_MANUAL: '/compare/manual',
  COMPARE_CHOOSE: '/compare/choose',
  COMPARE_RUN: '/compare/run',
  COMPARE_MANUAL_LIST: '/compare/manual/list',
  COMPARE_LIST: '/compare/list',
  COMPARE_RESULT: '/compare/result/:bulkComparisonResultId',
  COMPARE_DETAIL: '/compare/result/:bulkComparisonResultId/detail/:bulkComparisonDetailId',
  COMPARE_MANUAL_RESULT: '/compare/manual/result/:bulkComparisonResultId',
}

export default class CompareRoutes {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly bulkLoadService: UserPermissionsService,
    private readonly prisonerService: PrisonerService,
    private readonly comparisonService: ComparisonService
  ) {
    // intentionally left blank
  }

  /* eslint-disable */
  public index: RequestHandler = async (req, res) => {
    const allowBulkLoad = this.bulkLoadService.allowBulkLoad(res.locals.user.userRoles)
    const allowManualComparison = this.bulkLoadService.allowManualComparison(res.locals.user.userRoles)
    res.render('pages/compare/index', {
      allowBulkLoad,
      allowManualComparison,
    })
  }

  public choose: RequestHandler = async (req, res) => {
    const allowBulkComparison = this.bulkLoadService.allowBulkComparison(res.locals.user.userRoles)
    const usersCaseload = await this.prisonerService.getUsersCaseloads(res.locals.user.username, res.locals.user.token)
    const caseloadRadios = usersCaseload.map(caseload => ({ text: caseload.description, value: caseload.caseLoadId }))
    res.render('pages/compare/choosePrison', {
      allowBulkComparison,
      caseloadRadios,
    })
    return
  }

  public list: RequestHandler = async (req, res) => {
    const { userRoles, token, caseloadMap } = res.locals.user
    const allowBulkComparison = this.bulkLoadService.allowBulkComparison(userRoles)
    const prisonComparisons = await this.comparisonService.getPrisonComparisons(token)
    const comparisons = prisonComparisons.map(comparison => new ListComparisonViewModel(comparison, caseloadMap))
    res.render('pages/compare/list', {
      allowBulkComparison,
      comparisons,
    })
    return
  }

  public manual_list: RequestHandler = async (req, res) => {
    const { userRoles, token, caseloadMap } = res.locals.user
    const allowBulkComparison = this.bulkLoadService.allowBulkComparison(userRoles)
    const manualComparisons = await this.comparisonService.getManualComparisons(token)
    const comparisons = manualComparisons.map(comparison => new ListComparisonViewModel(comparison, caseloadMap))
    res.render('pages/compare/manualList', {
      allowBulkComparison,
      comparisons,
    })
    return
  }

  public result: RequestHandler = async (req, res) => {
    const { bulkComparisonResultId } = req.params
    const { token, userRoles, caseloadMap } = res.locals.user
    const comparison = await this.comparisonService.getPrisonComparison(bulkComparisonResultId, token)
    const allowBulkComparison = this.bulkLoadService.allowBulkComparison(userRoles)
    return res.render('pages/compare/resultOverview', {
      allowBulkComparison,
      comparison: new ComparisonResultOverviewModel(comparison, caseloadMap, false),
      bulkComparisonResultId,
    })
  }

  public manualResult: RequestHandler = async (req, res) => {
    const { bulkComparisonResultId } = req.params
    const { token, userRoles, caseloadMap } = res.locals.user
    const comparison = await this.comparisonService.getManualComparison(bulkComparisonResultId, token)
    const allowManualComparison = this.bulkLoadService.allowManualComparison(userRoles)
    return res.render('pages/compare/manualResultOverview', {
      allowManualComparison,
      comparison: new ComparisonResultOverviewModel(comparison, caseloadMap, true),
      bulkComparisonResultId,
    })
  }

  public run: RequestHandler = async (req, res) => {
    const { selectedOMU } = req.body
    const { token } = res.locals.user
    const comparison = await this.comparisonService.createPrisonComparison(selectedOMU, token)
    return res.redirect(`/compare/result/${comparison.comparisonShortReference}`)
  }

  public detail: RequestHandler = async (req, res) => {
    const { bulkComparisonResultId, bulkComparisonDetailId } = req.params
    const { token, userRoles } = res.locals.user
    const comparisonMismatch = await this.comparisonService.getPrisonMismatchComparison(
      bulkComparisonResultId,
      bulkComparisonDetailId,
      token
    )

    // retrieve the information about the bulkComparison
    const allowBulkComparison = this.bulkLoadService.allowBulkComparison(userRoles)

    res.render('pages/compare/resultDetail', {
      allowBulkComparison,
      bulkComparisonResultId,
      bulkComparisonDetailId,
      bulkComparison: new ComparisonResultMismatchDetailModel(comparisonMismatch),
    })
    return
  }

  /* eslint-disable */
  public submitManualCalculation: RequestHandler = async (req, res) => {
    const { token } = res.locals.user
    const { prisonerIds } = req.body
    const nomsIds = prisonerIds.split(/\r?\n/)
    if (nomsIds.length > 500) return res.redirect(`/compare/manual`)

    const comparison = await this.comparisonService.createManualComparison(nomsIds, token)
    return res.redirect(`/compare/manual/result/${comparison.comparisonShortReference}`)
  }

  public manualCalculation: RequestHandler = async (req, res): Promise<void> => {
    const { username, token } = res.locals.user
    const { bookingData } = req.query
    try {
      const releaseDates = bookingData
        ? await this.calculateReleaseDatesService.calculateReleaseDates(username, bookingData, token)
        : ''

      res.render('pages/compare/manual', {
        releaseDates: releaseDates ? JSON.stringify(releaseDates, undefined, 4) : '',
        bookingData,
      })
    } catch (ex) {
      logger.error(ex)
      const validationErrors =
        ex.status > 499 && ex.status < 600
          ? [
              {
                text: `There was an error in the calculation API service: ${ex.data.userMessage}`,
                href: '#bookingData',
              },
            ]
          : [
              {
                text: 'The JSON is malformed',
                href: '#bookingData',
              },
            ]
      res.render('pages/test-pages/testCalculation', {
        bookingData,
        validationErrors,
      })
    }
  }
}

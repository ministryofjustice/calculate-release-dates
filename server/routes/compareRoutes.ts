import { RequestHandler } from 'express'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import UserPermissionsService from '../services/userPermissionsService'
import PrisonerService from '../services/prisonerService'
import ComparisonService from '../services/comparisonService'
import ListComparisonViewModel from '../models/ListComparisonViewModel'
import ComparisonResultOverviewModel from '../models/ComparisonResultOverviewModel'
import ComparisonResultMismatchDetailModel from '../models/ComparisonResultMismatchDetailModel'
import {
  ComparisonPersonDiscrepancyCause,
  ComparisonPersonDiscrepancyRequest,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { FieldValidationError } from '../types/FieldValidationError'

export const comparePaths = {
  COMPARE_INDEX: '/compare',
  COMPARE_MANUAL: '/compare/manual',
  COMPARE_CHOOSE: '/compare/choose',
  COMPARE_RUN: '/compare/run',
  COMPARE_MANUAL_LIST: '/compare/manual/list',
  COMPARE_LIST: '/compare/list',
  COMPARE_RESULT: '/compare/result/:bulkComparisonResultId',
  COMPARE_DETAIL: '/compare/result/:bulkComparisonResultId/detail/:bulkComparisonDetailId',
  COMPARE_DETAIL_JSON: '/compare/result/:bulkComparisonResultId/detail/:bulkComparisonDetailId/json',
  COMPARE_MANUAL_RESULT: '/compare/manual/result/:bulkComparisonResultId',
  COMPARE_MANUAL_DETAIL: '/compare/manual/result/:bulkComparisonResultId/detail/:bulkComparisonDetailId',
}

export default class CompareRoutes {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly bulkLoadService: UserPermissionsService,
    private readonly prisonerService: PrisonerService,
    private readonly comparisonService: ComparisonService,
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
    const usersCaseload = await this.prisonerService.getUsersCaseloads(res.locals.user.token)
    const caseloadItems = usersCaseload.map(caseload => ({ text: caseload.description, value: caseload.caseLoadId }))
    caseloadItems.push({ text: 'All prisons in caseload **Run With Caution**', value: 'all' })
    caseloadItems.unshift({
      text: '',
      value: '',
    })
    caseloadItems.sort((a, b) => a.text.localeCompare(b.text))

    let errorMessage = ''

    res.render('pages/compare/choosePrison', {
      allowBulkComparison,
      caseloadItems,
      errorMessage,
    })
  }

  public list: RequestHandler = async (req, res) => {
    const { userRoles, caseloadMap, username } = res.locals.user
    const allowBulkComparison = this.bulkLoadService.allowBulkComparison(userRoles)
    const prisonComparisons = await this.comparisonService.getPrisonComparisons(username)
    const comparisons = prisonComparisons.map(comparison => new ListComparisonViewModel(comparison, caseloadMap))
    let sortedComparisons = Array.from(comparisons).sort(function (a, b) {
      return new Date(b.calculatedAt).valueOf() - new Date(a.calculatedAt).valueOf()
    })

    const inputPrison = req.query.prisonName

    if (inputPrison) {
      sortedComparisons = sortedComparisons.filter(comparison => comparison.prisonName == inputPrison)
    }

    const prisonsArray = [...new Set(comparisons.map(comparison => comparison.prisonName))]
    const prisons = prisonsArray.map(prisonString => ({
      value: prisonString,
      text: prisonString,
      selected: prisonString == inputPrison,
    }))
    prisons.unshift({
      text: '',
      value: '',
      selected: false,
    })
    const userComparisons = sortedComparisons.filter(comparison => comparison.calculatedBy == username)
    const otherComparisons = sortedComparisons.filter(comparison => comparison.calculatedBy !== username)
    res.render('pages/compare/list', {
      allowBulkComparison,
      otherComparisons,
      userComparisons,
      prisons,
    })
  }

  public manual_list: RequestHandler = async (req, res) => {
    const { userRoles, caseloadMap, username } = res.locals.user
    const allowBulkComparison = this.bulkLoadService.allowBulkComparison(userRoles)
    const manualComparisons = await this.comparisonService.getManualComparisons(username)
    const comparisons = manualComparisons.map(comparison => new ListComparisonViewModel(comparison, caseloadMap))
    const sortedComparisons = Array.from(comparisons).sort(function (a, b) {
      return new Date(b.calculatedAt).valueOf() - new Date(a.calculatedAt).valueOf()
    })
    const userComparisons = sortedComparisons.filter(comparison => comparison.calculatedBy == username)
    const otherComparisons = sortedComparisons.filter(comparison => comparison.calculatedBy !== username)
    res.render('pages/compare/manualList', {
      allowBulkComparison,
      otherComparisons,
      userComparisons,
    })
  }

  public result: RequestHandler = async (req, res) => {
    const { bulkComparisonResultId } = req.params
    const { username, userRoles, caseloadMap } = res.locals.user
    const comparison = await this.comparisonService.getPrisonComparison(bulkComparisonResultId, username)
    const allowBulkComparison = this.bulkLoadService.allowBulkComparison(userRoles)
    const overviewModel = new ComparisonResultOverviewModel(comparison, caseloadMap)
    return res.render('pages/compare/resultOverview', {
      allowBulkComparison,
      comparison: overviewModel,
      bulkComparisonResultId,
    })
  }

  public manualResult: RequestHandler = async (req, res) => {
    const { bulkComparisonResultId } = req.params
    const { username, userRoles, caseloadMap } = res.locals.user
    const comparison = await this.comparisonService.getManualComparison(bulkComparisonResultId, username)
    const allowManualComparison = this.bulkLoadService.allowManualComparison(userRoles)
    return res.render('pages/compare/manualResultOverview', {
      allowManualComparison,
      comparison: new ComparisonResultOverviewModel(comparison, caseloadMap),
      bulkComparisonResultId,
    })
  }

  public run: RequestHandler = async (req, res) => {
    const { selectedOMU, comparisonType } = req.body
    const { username } = res.locals.user
    const comparison = await this.comparisonService.createPrisonComparison(username, selectedOMU, comparisonType)
    return res.redirect(`/compare/result/${comparison.comparisonShortReference}`)
  }

  public detail: RequestHandler = async (req, res) => {
    const { bulkComparisonResultId, bulkComparisonDetailId } = req.params
    const { username } = res.locals.user
    const comparisonMismatch = await this.comparisonService.getPrisonMismatchComparison(
      bulkComparisonResultId,
      bulkComparisonDetailId,
      username,
    )

    let discrepancy = null
    if (comparisonMismatch.hasDiscrepancyRecord) {
      const discrepancySummary = await this.comparisonService.getComparisonPersonDiscrepancy(
        bulkComparisonResultId,
        bulkComparisonDetailId,
        username,
      )
      discrepancy = { ...discrepancySummary, causes: this.summaryCausesToFormCauses(discrepancySummary.causes) }
    }

    res.render('pages/compare/resultDetail', {
      bulkComparisonResultId,
      bulkComparisonDetailId,
      bulkComparison: new ComparisonResultMismatchDetailModel(comparisonMismatch),
      discrepancy,
    })
    return
  }

  public viewJson: RequestHandler = async (req, res): Promise<void> => {
    const { bulkComparisonResultId, bulkComparisonDetailId } = req.params
    const { username } = res.locals.user
    const comparisonMismatch = await this.comparisonService.getPrisonMismatchComparison(
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
    })
  }

  public submitDetail: RequestHandler = async (req, res) => {
    const { bulkComparisonResultId, bulkComparisonDetailId } = req.params
    const { username } = res.locals.user
    const { impact, causes, detail, priority, action } = req.body
    const formCauses = Array.isArray(causes) ? causes : [causes]

    const validationErrors = this.validateFormData(req.body)

    const mismatchCauses: ComparisonPersonDiscrepancyCause[] = formCauses.map(cause => {
      const subCategory = cause === 'OTHER' ? cause : req.body[`${cause}-subType`]
      return {
        category: cause,
        subCategory,
        other: subCategory === 'OTHER' ? req.body[`${cause}-otherInput`] : undefined,
      }
    })

    if (Object.keys(validationErrors).length === 0) {
      const discrepancy: ComparisonPersonDiscrepancyRequest = {
        impact,
        causes: mismatchCauses,
        detail,
        priority,
        action,
      }

      await this.comparisonService.createComparisonPersonDiscrepancy(
        bulkComparisonResultId,
        bulkComparisonDetailId,
        discrepancy,
        username,
      )
      return res.redirect(`/compare/result/${bulkComparisonResultId}`)
    }

    const discrepancy = {
      impact,
      detail,
      priority,
      action,
      causes: this.summaryCausesToFormCauses(mismatchCauses),
    }

    const comparisonMismatch = await this.comparisonService.getPrisonMismatchComparison(
      bulkComparisonResultId,
      bulkComparisonDetailId,
      username,
    )

    return res.render('pages/compare/resultDetail', {
      bulkComparisonResultId,
      bulkComparisonDetailId,
      bulkComparison: new ComparisonResultMismatchDetailModel(comparisonMismatch),
      discrepancy,
      validationErrors,
    })
  }

  public manualDetail: RequestHandler = async (req, res) => {
    const { bulkComparisonResultId, bulkComparisonDetailId } = req.params
    const { username } = res.locals.user
    const comparisonMismatch = await this.comparisonService.getManualMismatchComparison(
      bulkComparisonResultId,
      bulkComparisonDetailId,
      username,
    )

    let discrepancy = null
    if (comparisonMismatch.hasDiscrepancyRecord) {
      const discrepancySummary = await this.comparisonService.getManualComparisonPersonDiscrepancy(
        bulkComparisonResultId,
        bulkComparisonDetailId,
        username,
      )
      discrepancy = { ...discrepancySummary, causes: this.summaryCausesToFormCauses(discrepancySummary.causes) }
    }

    return res.render('pages/compare/manualResultDetail', {
      bulkComparisonResultId,
      bulkComparisonDetailId,
      bulkComparison: new ComparisonResultMismatchDetailModel(comparisonMismatch),
      discrepancy,
    })
  }

  public submitManualDetail: RequestHandler = async (req, res) => {
    const { bulkComparisonResultId, bulkComparisonDetailId } = req.params
    const { username } = res.locals.user
    const { impact, causes, detail, priority, action } = req.body
    const formCauses = Array.isArray(causes) ? causes : [causes]

    const validationErrors = this.validateFormData(req.body)
    const mismatchCauses: ComparisonPersonDiscrepancyCause[] = formCauses.map(cause => {
      const subCategory = cause === 'OTHER' ? cause : req.body[`${cause}-subType`]
      return {
        category: cause,
        subCategory,
        other: subCategory === 'OTHER' ? req.body[`${cause}-otherInput`] : undefined,
      }
    })

    if (Object.keys(validationErrors).length === 0) {
      const discrepancy: ComparisonPersonDiscrepancyRequest = {
        impact,
        causes: mismatchCauses,
        detail,
        priority,
        action,
      }

      await this.comparisonService.createManualComparisonPersonDiscrepancy(
        bulkComparisonResultId,
        bulkComparisonDetailId,
        discrepancy,
        username,
      )
      return res.redirect(`/compare/manual/result/${bulkComparisonResultId}`)
    }

    const discrepancy = {
      impact,
      detail,
      priority,
      action,
      causes: this.summaryCausesToFormCauses(mismatchCauses),
    }

    const comparisonMismatch = await this.comparisonService.getManualMismatchComparison(
      bulkComparisonResultId,
      bulkComparisonDetailId,
      username,
    )

    return res.render('pages/compare/resultDetail', {
      bulkComparisonResultId,
      bulkComparisonDetailId,
      bulkComparison: new ComparisonResultMismatchDetailModel(comparisonMismatch),
      discrepancy,
      validationErrors,
    })
  }

  /* eslint-disable */
  public submitManualCalculation: RequestHandler = async (req, res) => {
    const { username } = res.locals.user
    const { prisonerIds } = req.body
    const nomsIds = prisonerIds.split(/\r?\n/)
    const comparison = await this.comparisonService.createManualComparison(nomsIds, username)
    return res.redirect(`/compare/manual/result/${comparison.comparisonShortReference}`)
  }

  public manualCalculation: RequestHandler = async (req, res): Promise<void> => {
    return res.render('pages/compare/manual')
  }

  private summaryCausesToFormCauses(summaryCauses: ComparisonPersonDiscrepancyCause[]) {
    return summaryCauses.reduce((obj, item) => {
      return {
        ...obj,
        [item['category']]: item,
      }
    }, {})
  }

  private validateFormData(formData: any): FieldValidationError[] {
    const { impact, causes, detail, priority, action } = formData
    const formCauses = Array.isArray(causes) ? causes : [causes]

    const validationErrors: FieldValidationError[] = []
    if (!impact) {
      validationErrors.push({ field: 'impact', message: 'Enter the impact of the mismatch' })
    }

    if (!causes) {
      validationErrors.push({ field: 'causes', message: 'Select the cause of the discrepancy' })
    }

    if (!detail) {
      validationErrors.push({ field: 'detail', message: 'Enter detail on the discrepancy' })
    }

    if (!priority) {
      validationErrors.push({ field: 'priority', message: 'Select the priority of resolving this problem' })
    }

    if (!action) {
      validationErrors.push({ field: 'action', message: 'Enter the recommended action' })
    }

    formCauses.forEach(cause => {
      const subCategory = cause === 'OTHER' ? cause : formData[`${cause}-subType`]
      if (!subCategory) {
        validationErrors.push({ field: `${cause}-subType`, message: `Select the cause of the ${cause} discrepancy` })
      }
    })

    return validationErrors
  }
}

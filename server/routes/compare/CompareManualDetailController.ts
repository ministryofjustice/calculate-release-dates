import { Request, Response } from 'express'
import { Controller } from '../controller'
import ComparisonService from '../../services/comparisonService'
import ComparisonResultMismatchDetailModel from '../../models/ComparisonResultMismatchDetailModel'
import {
  ComparisonPersonDiscrepancyCause,
  ComparisonPersonDiscrepancyRequest,
} from '../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { FieldValidationError } from '../../types/FieldValidationError'

export default class CompareManualDetailController implements Controller {
  constructor(private readonly comparisonService: ComparisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
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
      discrepancy = {
        ...discrepancySummary,
        causes: this.summaryCausesToFormCauses(discrepancySummary.causes),
      }
    }

    res.render('pages/compare/manualResultDetail', {
      bulkComparisonResultId,
      bulkComparisonDetailId,
      bulkComparison: new ComparisonResultMismatchDetailModel(comparisonMismatch),
      discrepancy,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
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

    if (validationErrors.length === 0) {
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

      res.redirect(`/compare/manual/result/${bulkComparisonResultId}`)
      return
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

    res.render('pages/compare/resultDetail', {
      bulkComparisonResultId,
      bulkComparisonDetailId,
      bulkComparison: new ComparisonResultMismatchDetailModel(comparisonMismatch),
      discrepancy,
      validationErrors,
    })
  }

  private summaryCausesToFormCauses(summaryCauses: ComparisonPersonDiscrepancyCause[]) {
    return summaryCauses.reduce((obj, item) => {
      return {
        ...obj,
        [item.category]: item,
      }
    }, {})
  }

  private validateFormData(formData: {
    impact: string
    causes: string
    detail: string
    priority: string
    action: string
    [key: string]: unknown
  }): FieldValidationError[] {
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

    formCauses.forEach((cause: string) => {
      const subCategory = cause === 'OTHER' ? cause : formData[`${cause}-subType`]
      if (!subCategory) {
        validationErrors.push({ field: `${cause}-subType`, message: `Select the cause of the ${cause} discrepancy` })
      }
    })

    return validationErrors
  }
}

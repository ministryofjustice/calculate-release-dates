import { Request, Response } from 'express'
import { Controller } from '../controller'
import ComparisonService from '../../services/comparisonService'
import { removeTags } from '../../utils/utils'

export default class UnusedDeductionsDetailController implements Controller {
  constructor(private readonly comparisonService: ComparisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { comparisonId, personId } = req.params
    const detail = await this.comparisonService.getUnusedDeductionsComparisonPerson(
      comparisonId,
      personId,
      res.locals.user.username,
    )
    // Existing unused deductions are not inputs to a fresh calculation
    const adjustments = detail.adjustments.filter(adjustment => adjustment.adjustmentType !== 'UNUSED_DEDUCTIONS')
    const validationMessages = detail.validationMessages?.map(message =>
      message.contentType === 'HTML' && message.message
        ? { ...message, message: removeTags(message.message) }
        : message,
    )
    res.render('pages/compare/unusedDeductions/detail', {
      detail: { ...detail, adjustments, validationMessages },
      comparison: detail.comparison,
    })
  }
}

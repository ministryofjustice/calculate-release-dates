import { Request, Response } from 'express'
import { Controller } from '../controller'
import ComparisonService from '../../services/comparisonService'
import PrisonerService from '../../services/prisonerService'
import { UnusedDeductionsComparisonInput } from '../../@types/calculateReleaseDates/unusedDeductionsComparisonTypes'
import { renderUnusedDeductionsIndex } from './UnusedDeductionsIndexController'

const ERROR_MESSAGES: Record<string, string> = {
  manual: 'Enter at least one prisoner number',
  prison: 'Select a prison',
  default: 'Select how you want to run the comparison',
}

export default class UnusedDeductionsRunController implements Controller {
  constructor(
    private readonly comparisonService: ComparisonService,
    private readonly prisonerService: PrisonerService,
  ) {}

  POST = async (req: Request, res: Response): Promise<void> => {
    const { username } = res.locals.user
    const { runType, prison, prisonerIds } = req.body
    const form = { runType, prison, prisonerIds }

    let input: UnusedDeductionsComparisonInput
    if (runType === 'all') {
      input = { prison: 'all' }
    } else if (runType === 'prison' && prison) {
      input = { prison }
    } else if (runType === 'manual') {
      const ids = ((prisonerIds as string) ?? '')
        .split(/\r?\n/)
        .map(id => id.trim())
        .filter(id => id.length > 0)
      if (ids.length > 0) {
        input = { prisonerIds: ids }
      }
    }

    if (!input) {
      const message = ERROR_MESSAGES[runType] ?? ERROR_MESSAGES.default
      await renderUnusedDeductionsIndex(this.prisonerService, res, form, [{ text: message, href: '#runType' }])
      return
    }

    const comparison = await this.comparisonService.createUnusedDeductionsComparison(input, username)
    res.redirect(`/compare/unused-deductions/result/${comparison.comparisonShortReference}`)
  }
}

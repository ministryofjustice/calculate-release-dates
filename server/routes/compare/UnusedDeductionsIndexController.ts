import { Request, Response } from 'express'
import { Controller } from '../controller'
import PrisonerService from '../../services/prisonerService'

export const renderUnusedDeductionsIndex = async (
  prisonerService: PrisonerService,
  res: Response,
  form: { runType?: string; prison?: string; prisonerIds?: string } = {},
  errors: { text: string; href: string }[] = [],
): Promise<void> => {
  const caseloads = await prisonerService.getUsersCaseloads(res.locals.user.token)
  const caseloadItems = [{ text: 'Select a prison', value: '' }].concat(
    caseloads
      .map(caseload => ({ text: caseload.description, value: caseload.caseLoadId }))
      .sort((a, b) => a.text.localeCompare(b.text)),
  )
  if (errors.length) {
    res.status(400)
  }
  res.render('pages/compare/unusedDeductions/index', { caseloadItems, form, errors })
}

export default class UnusedDeductionsIndexController implements Controller {
  constructor(private readonly prisonerService: PrisonerService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    await renderUnusedDeductionsIndex(this.prisonerService, res)
  }
}

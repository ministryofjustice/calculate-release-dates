import { Request, Response } from 'express'
import { Controller } from '../controller'
import UserPermissionsService from '../../services/userPermissionsService'
import PrisonerService from '../../services/prisonerService'

export default class CompareChooseController implements Controller {
  constructor(
    private readonly userPermissionsService: UserPermissionsService,
    private readonly prisonerService: PrisonerService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const allowBulkComparison = this.userPermissionsService.allowBulkComparison(res.locals.user.userRoles)
    const usersCaseload = await this.prisonerService.getUsersCaseloads(res.locals.user.token)

    const caseloadItems = usersCaseload
      .map(caseload => ({ text: caseload.description, value: caseload.caseLoadId }))
      .concat({ text: 'All prisons in caseload **Run With Caution**', value: 'all' })

    caseloadItems.unshift({ text: '', value: '' })
    caseloadItems.sort((a, b) => a.text.localeCompare(b.text))

    const errorMessage = ''

    res.render('pages/compare/choosePrison', {
      allowBulkComparison,
      caseloadItems,
      errorMessage,
    })
  }
}

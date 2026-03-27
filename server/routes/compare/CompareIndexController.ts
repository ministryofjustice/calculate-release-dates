import { Request, Response } from 'express'
import { Controller } from '../controller'
import UserPermissionsService from '../../services/userPermissionsService'

export default class CompareIndexController implements Controller {
  constructor(private readonly userPermissionsService: UserPermissionsService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const allowBulkLoad = this.userPermissionsService.allowBulkLoad(res.locals.user.userRoles)
    const allowManualComparison = this.userPermissionsService.allowManualComparison(res.locals.user.userRoles)

    res.render('pages/compare/index', {
      allowBulkLoad,
      allowManualComparison,
    })
  }
}

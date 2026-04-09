import { RequestHandler } from 'express'
import PrisonerService from '../services/prisonerService'

export default function getPrisoner(prisonerService: PrisonerService): RequestHandler {
  return async (req, res, next) => {
    const { user } = res.locals
    const { nomsId } = req.params

    if (user && nomsId) {
      const { caseloads, userRoles, username } = res.locals.user
      req.prisoner = await prisonerService.getPrisonerDetail(nomsId, username, caseloads, userRoles)
    }
    return next()
  }
}

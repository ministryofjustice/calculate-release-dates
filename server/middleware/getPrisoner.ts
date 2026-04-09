import { RequestHandler } from 'express'
import PrisonerService from '../services/prisonerService'

export default function getPrisoner(prisonerService: PrisonerService): RequestHandler {
  return async (req, res, next) => {
    const { caseloads, userRoles, username } = res.locals.user
    const { nomsId } = req.params

    if (username && nomsId) {
      req.prisoner = await prisonerService.getPrisonerDetail(nomsId, username, caseloads, userRoles)
    }
    return next()
  }
}

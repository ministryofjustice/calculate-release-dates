import { RequestHandler } from 'express'
import AuthorisedRoles from '../enumerations/authorisedRoles'

export default function setUpCCARDComponents(): RequestHandler {
  return async (req, res, next) => {
    const roles = res.locals.user.userRoles
    res.locals.showCCARDNav =
      roles.includes(AuthorisedRoles.ROLE_RELEASE_DATES_CALCULATOR) && roles.includes('ROLE_ADJUSTMENTS_MAINTAINER')
    next()
  }
}

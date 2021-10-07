import jwtDecode from 'jwt-decode'
import { Request, Response, NextFunction } from 'express'
import logger from '../../logger'
import AuthorisedRoles from '../enumerations/authorisedRoles'

const isAuthorisedRole = (role: string): boolean =>
  Object.keys(AuthorisedRoles)
    .map(key => AuthorisedRoles[key])
    .includes(role)

export default function authorisationMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (res.locals && res.locals.user && res.locals.user.token) {
    const { authorities: roles = [] } = jwtDecode(res.locals.user.token) as { authorities?: string[] }
    if (!roles.some(isAuthorisedRole)) {
      logger.error('User is not authorised to access this service')
      return res.redirect('/authError')
    }

    res.locals.user.userRoles = roles

    return next()
  }
  req.session.returnTo = req.originalUrl
  return res.redirect('/login')
}

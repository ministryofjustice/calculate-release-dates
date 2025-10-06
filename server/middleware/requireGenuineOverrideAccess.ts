import type { RequestHandler } from 'express'

import logger from '../../logger'
import { hasGenuineOverridesAccess } from '../routes/genuine-overrides/genuineOverrideUtils'

export default function requireGenuineOverrideAccess(): RequestHandler {
  return (req, res, next) => {
    const { userRoles } = res.locals.user
    if (!hasGenuineOverridesAccess(userRoles ?? [])) {
      logger.error('User is not authorised to access genuine overrides')
      return res.redirect('/authError')
    }
    return next()
  }
}

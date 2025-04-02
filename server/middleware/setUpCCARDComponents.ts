import { RequestHandler } from 'express'
import { ServiceHeaderConfig } from '@ministryofjustice/hmpps-court-cases-release-dates-design/hmpps/@types'
import AuthorisedRoles from '../enumerations/authorisedRoles'
import { hmppsDesignSystemsEnvironmentName } from '../utils/utils'

export default function setUpCCARDComponents(): RequestHandler {
  return async (req, res, next) => {
    const roles = res.locals.user.userRoles
    res.locals.showCCARDNav =
      roles.includes(AuthorisedRoles.ROLE_RELEASE_DATES_CALCULATOR) && roles.includes('ROLE_ADJUSTMENTS_MAINTAINER')
    res.locals.defaultServiceHeaderConfig = {
      environment: hmppsDesignSystemsEnvironmentName(),
    } as ServiceHeaderConfig
    next()
  }
}

import { RequestHandler } from 'express'
import { ServiceHeaderConfig } from '@ministryofjustice/hmpps-court-cases-release-dates-design/hmpps/@types'
import { hmppsDesignSystemsEnvironmentName } from '../utils/utils'

export default function setUpCCARDComponents(): RequestHandler {
  return async (req, res, next) => {
    res.locals.defaultServiceHeaderConfig = {
      environment: hmppsDesignSystemsEnvironmentName(),
    } as ServiceHeaderConfig
    next()
  }
}

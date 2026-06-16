import type { NextFunction, Request, Response } from 'express'
import type { HTTPError } from 'superagent'
import { SanitisedError } from '@ministryofjustice/hmpps-rest-client'
import logger from '../logger'
import { FullPageError, FullPageErrorType } from './types/FullPageError'
import CommonLayoutViewModel from './models/CommonLayoutViewModel'

export default function createErrorHandler(production: boolean) {
  return (
    error: HTTPError | FullPageError | SanitisedError,
    req: Request,
    res: Response,
    _next: NextFunction,
  ): void => {
    logger.error(`Error handling request for '${req.originalUrl}', user '${res.locals.user?.username}'`, error)
    const status = error instanceof SanitisedError ? error.responseStatus : error.status
    if (status === 401 || status === 403) {
      logger.info('Logging user out from default error handler')
      return res.redirect('/sign-out')
    }
    if (error instanceof FullPageError) {
      res.locals.errorKey = FullPageErrorType[error.errorKey]
      res.locals.nomsId = error.nomsId
      res.locals.prisonerDetails = error.prisonerDetails
      res.locals.commonElementConfig = new CommonLayoutViewModel(error.prisonerDetails).commonElementConfig
    } else {
      res.locals.message = production
        ? 'Something went wrong. The error has been logged. Please try again'
        : error.message
    }
    res.locals.status = status
    res.locals.stack = production ? null : error.stack
    res.status(status || 500)
    return res.render('pages/error')
  }
}

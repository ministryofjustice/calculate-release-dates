import type { NextFunction, Request, Response } from 'express'
import { HttpError } from 'http-errors'
import type { HTTPError } from 'superagent'
import { SanitisedError } from '@ministryofjustice/hmpps-rest-client'
import logger from '../logger'
import { FullPageError, FullPageErrorType } from './types/FullPageError'
import CommonLayoutViewModel from './models/CommonLayoutViewModel'

export default function createErrorHandler(production: boolean) {
  return (
    error: HTTPError | FullPageError | HttpError | SanitisedError,
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    logger.error(`Error handling request for '${req.originalUrl}', user '${res.locals.user?.username}'`, error)
    let status = 0
    if ('status' in error) {
      status = error.status
    } else if (error instanceof SanitisedError) {
      status = error.responseStatus
    }
    if ('errorKey' in error) {
      res.locals.errorKey = FullPageErrorType[error.errorKey]
      res.locals.nomsId = error.nomsId
      res.locals.prisonerDetails = error.prisonerDetails
      res.locals.commonElementConfig = new CommonLayoutViewModel(error.prisonerDetails).commonElementConfig
    } else {
      if (status === 401 || status === 403) {
        logger.info('Logging user out')
        return res.redirect('/sign-out')
      }

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

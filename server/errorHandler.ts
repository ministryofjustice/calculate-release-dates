import type { Request, Response, NextFunction } from 'express'
import { HttpError } from 'http-errors'
import type { HTTPError } from 'superagent'
import logger from '../logger'
import { FullPageError, FullPageErrorType } from './types/FullPageError'

export default function createErrorHandler(production: boolean) {
  return (error: HTTPError | FullPageError | HttpError, req: Request, res: Response, next: NextFunction): void => {
    logger.error(`Error handling request for '${req.originalUrl}', user '${res.locals.user?.username}'`, error)
    if ('errorKey' in error) {
      res.locals.errorKey = FullPageErrorType[error.errorKey]
      res.locals.nomsId = error.nomsId
      res.locals.prisonerDetails = error.prisonerDetails
    } else {
      if (error.status === 401 || error.status === 403) {
        logger.info('Logging user out')
        return res.redirect('/sign-out')
      }

      res.locals.message = production
        ? 'Something went wrong. The error has been logged. Please try again'
        : error.message
    }

    res.locals.status = error.status
    res.locals.stack = production ? null : error.stack
    res.status(error.status || 500)
    return res.render('pages/error')
  }
}

import type { NextFunction, Request, Response } from 'express'
import type { HTTPError } from 'superagent'
import logger from '../logger'
import { FullPageError, FullPageErrorType } from './types/FullPageError'
import CommonLayoutViewModel from './models/CommonLayoutViewModel'

export default function createErrorHandler(production: boolean) {
  return (error: HTTPError | FullPageError, req: Request, res: Response, _next: NextFunction): void => {
    logger.error(`Error handling request for '${req.originalUrl}', user '${res.locals.user?.username}'`, error)
    if (error.status === 401 || error.status === 403) {
      logger.info('Logging user out')
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
    res.locals.status = error.status
    res.locals.stack = production ? null : error.stack
    res.status(error.status || 500)
    return res.render('pages/error')
  }
}

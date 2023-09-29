import express from 'express'

import path from 'path'
import createError from 'http-errors'

import csurf from 'csurf'
import cookieParser from 'cookie-parser'
import routes from './routes'
import nunjucksSetup from './utils/nunjucksSetup'
import errorHandler from './errorHandler'

import setUpWebSession from './middleware/setUpWebSession'
import setUpStaticResources from './middleware/setUpStaticResources'
import setUpWebSecurity from './middleware/setUpWebSecurity'
import setUpAuthentication from './middleware/setUpAuthentication'
import setUpHealthChecks from './middleware/setUpHealthChecks'
import setUpWebRequestParsing from './middleware/setupRequestParsing'
import authorisationMiddleware from './middleware/authorisationMiddleware'
import { Services } from './services'
import setUpCurrentUser from './middleware/setUpCurrentUser'
import setUpCsrf from './middleware/setUpCsrf'
import setUpFrontendComponents from "./middleware/setUpDPSFrontendComponents";

export default function createApp(services: Services): express.Application {
  const app = express()

  app.set('json spaces', 2)
  app.set('trust proxy', true)
  app.set('port', process.env.PORT || 3000)

  app.use(setUpHealthChecks())
  app.use(setUpWebSecurity())
  app.use(setUpWebSession())
  app.use(setUpWebRequestParsing())
  app.use(setUpStaticResources())
  nunjucksSetup(app, path)
  app.use(setUpAuthentication())
  app.use(cookieParser())
  app.use(setUpCsrf())
  app.use(setUpCurrentUser(services))

  // CSRF protection
  if (process.env.NODE_ENV !== 'test') {
    app.use(csurf())
  }

  app.use(authorisationMiddleware)
  app.use(setUpFrontendComponents(services))
  app.use(routes(services))
  app.use((req, res, next) => next(createError(404, 'Not found')))
  app.use(errorHandler(process.env.NODE_ENV === 'production'))



  return app
}

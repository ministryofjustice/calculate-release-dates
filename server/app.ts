import express from 'express'

import createError from 'http-errors'

import cookieParser from 'cookie-parser'

import nunjucksSetup from './utils/nunjucksSetup'
import errorHandler from './errorHandler'
import authorisationMiddleware from './middleware/authorisationMiddleware'
import { metricsMiddleware } from './monitoring/metricsApp'

import setUpAuthentication from './middleware/setUpAuthentication'
import setUpCsrf from './middleware/setUpCsrf'
import setUpCurrentUser from './middleware/setUpCurrentUser'
import setUpHealthChecks from './middleware/setUpHealthChecks'
import setUpFrontendComponents from './middleware/setUpDPSFrontendComponents'
import setUpStaticResources from './middleware/setUpStaticResources'
import setUpWebRequestParsing from './middleware/setupRequestParsing'
import setUpWebSecurity from './middleware/setUpWebSecurity'
import setUpWebSession from './middleware/setUpWebSession'
import AuthorisedRoles from './enumerations/authorisedRoles'

import routes from './routes'
import type { Services } from './services'
import setUpCCARDComponents from './middleware/setUpCCARDComponents'
import populateValidationErrors from './middleware/populateValidationErrors'

export default function createApp(services: Services): express.Application {
  const app = express()

  app.set('json spaces', 2)
  app.set('trust proxy', true)
  app.set('port', process.env.PORT || 3000)

  app.use(metricsMiddleware)
  app.use(setUpHealthChecks(services.applicationInfo))
  app.use(setUpWebSecurity())
  app.use(setUpWebSession())
  app.use(setUpWebRequestParsing())
  app.use(setUpStaticResources())
  nunjucksSetup(app, services.applicationInfo)
  app.use(setUpAuthentication())
  app.use(cookieParser())
  app.use(authorisationMiddleware(Object.values(AuthorisedRoles)))
  app.use(setUpCsrf())
  app.use(setUpCurrentUser(services))
  app.use(setUpFrontendComponents(services))
  app.use(setUpCCARDComponents())
  app.use(populateValidationErrors())
  app.use(routes(services))

  app.use((req, res, next) => next(createError(404, 'Not found')))
  app.use(errorHandler(process.env.NODE_ENV === 'production'))

  return app
}

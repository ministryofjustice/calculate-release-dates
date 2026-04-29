import express, { Express } from 'express'
import cookieSession from 'cookie-session'
import { NotFound } from 'http-errors'

import routes from '../index'
import nunjucksSetup from '../../utils/nunjucksSetup'
import errorHandler from '../../errorHandler'
import type { Services } from '../../services'
import type { ApplicationInfo } from '../../applicationInfo'
import SessionSetup from './sessionSetup'
import setUpCCARDComponents from '../../middleware/setUpCCARDComponents'
import populateValidationErrors from '../../middleware/populateValidationErrors'
import getPrisoner from '../../middleware/getPrisoner'
import maintenanceMiddleware from '../../middleware/maintenanceMiddleware'
import config from '../../config'

const testAppInfo: ApplicationInfo = {
  applicationName: 'test',
  buildNumber: '1',
  gitRef: 'long ref',
  gitShortHash: 'short ref',
  branchName: 'main',
  environmentName: 'LOCAL',
}

export const user: Express.User = {
  name: 'FIRST LAST',
  userId: 'id',
  token: 'token',
  username: 'user1',
  displayName: 'First Last',
  active: true,
  activeCaseLoadId: 'MDI',
  authSource: 'NOMIS',
  userRoles: ['ROLE'],
}

export const flashProvider = jest.fn()

function appSetup(
  services: Services,
  production: boolean,
  userSupplier: () => Express.User,
  sessionSetup: SessionSetup = new SessionSetup(),
): Express {
  const app = express()

  app.set('view engine', 'njk')
  flashProvider.mockImplementation(_ => [])

  nunjucksSetup(app, testAppInfo)
  app.use(cookieSession({ keys: [''] }))
  app.use((req, res, next) => {
    req.user = userSupplier()
    req.flash = flashProvider
    res.locals = {
      user: { ...req.user },
    }
    sessionSetup.sessionDoctor(req)
    next()
  })
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  if (config.maintenanceMode) {
    app.use(maintenanceMiddleware)
  } else {
    app.use(setUpCCARDComponents())
    app.use(populateValidationErrors())
    app.use(
      ['/calculation/:nomsId', '/view/:nomsId', '/approved-dates/:nomsId', '/'],
      getPrisoner(services.prisonerService),
    )
    app.use(routes(services))
  }

  app.use((req, res, next) => next(new NotFound()))
  app.use(errorHandler(production))

  return app
}

export function appWithAllRoutes({
  production = false,
  services = {},
  userSupplier = () => user,
  sessionSetup = new SessionSetup(),
}: {
  production?: boolean
  services?: Partial<Services>
  userSupplier?: () => Express.User
  sessionSetup?: SessionSetup
}): Express {
  return appSetup(services as Services, production, userSupplier, sessionSetup)
}

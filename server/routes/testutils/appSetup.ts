import express, { Express } from 'express'
import cookieSession from 'cookie-session'
import type { Session, SessionData } from 'express-session'
import { NotFound } from 'http-errors'

import routes from '../index'
import nunjucksSetup from '../../utils/nunjucksSetup'
import errorHandler from '../../errorHandler'
import * as auth from '../../authentication/auth'
import type { Services } from '../../services'
import type { ApplicationInfo } from '../../applicationInfo'
import SessionSetup from './sessionSetup'
import setUpCCARDComponents from '../../middleware/setUpCCARDComponents'

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

type FlashSession = Session &
  Partial<SessionData> & {
    flashBag?: Record<string, string[]>
  }

function flashImpl(this: express.Request, type?: string, msg?: string) {
  const sess = (this.session ?? {}) as FlashSession

  if (!sess.flashBag) {
    sess.flashBag = {}
  }
  const bag = sess.flashBag

  if (type && typeof msg !== 'undefined') {
    ;(bag[type] ||= []).push(msg)
    return bag[type].length
  }

  if (type) {
    const out = bag[type] || []
    delete bag[type]
    return out
  }

  const all = { ...bag }
  sess.flashBag = {}
  return all
}

export function appSetup(
  services: Services,
  production: boolean,
  userSupplier: () => Express.User,
  sessionSetup: SessionSetup = new SessionSetup(),
): Express {
  const app = express()

  app.set('view engine', 'njk')

  nunjucksSetup(app, testAppInfo)
  app.use(cookieSession({ keys: [''] }))

  app.use((req, res, next) => {
    req.user = userSupplier()
    req.flash = flashImpl.bind(req) as typeof req.flash
    res.locals = {
      user: { ...req.user },
    }
    sessionSetup.sessionDoctor(req)
    next()
  })

  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(setUpCCARDComponents())
  app.use(routes(services))
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
  auth.default.authenticationMiddleware = () => (req, res, next) => next()
  return appSetup(services as Services, production, userSupplier, sessionSetup)
}

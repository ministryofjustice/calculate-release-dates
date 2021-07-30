import express, { Express, Router } from 'express'
import cookieSession from 'cookie-session'
import createError from 'http-errors'
import path from 'path'

import allRoutes from '../index'
import nunjucksSetup from '../../utils/nunjucksSetup'
import errorHandler from '../../errorHandler'
import UserService from '../../services/userService'
import * as auth from '../../authentication/auth'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import { Services } from '../../services'
import PrisonerService from '../../services/prisonerService'

const user = {
  name: 'john smith',
  firstName: 'john',
  lastName: 'smith',
  username: 'user1',
  displayName: 'John Smith',
}

class MockUserService extends UserService {
  constructor() {
    super(undefined)
  }

  async getUser(token: string) {
    return {
      token,
      ...user,
    }
  }
}

function appSetup({ router, production = false }: { router: Router; production?: boolean }): Express {
  const app = express()

  app.set('view engine', 'njk')

  nunjucksSetup(app, path)

  app.use((req, res, next) => {
    req.user = { ...user, token: 'token1', authSource: 'nomis', username: 'user1' }
    res.locals = { user: { ...req.user } }
    next()
  })

  app.use(cookieSession({ keys: [''] }))
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use('/', router)
  app.use((req, res, next) => next(createError(404, 'Not found')))
  app.use(errorHandler(production))

  return app
}

// eslint-disable-next-line import/prefer-default-export
export const appWithAllRoutes = (overrides: Partial<Services> = {}, production?: boolean): Express => {
  const router = allRoutes({
    userService: new MockUserService(),
    prisonerService: {} as PrisonerService,
    calculateReleaseDatesService: {} as CalculateReleaseDatesService,
    ...overrides,
  })
  auth.default.authenticationMiddleware = () => (req, res, next) => next()
  return appSetup({ router, production })
}

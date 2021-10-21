import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { Services } from '../services'
import populateCurrentUser from '../middleware/populateCurrentUser'
import flashMessages from '../middleware/flashMessageMiddleware'
import tokenVerifier from '../api/tokenVerification'
import auth from '../authentication/auth'
import OtherRoutes from './otherRoutes'
import CalculationRoutes from './calculationRoutes'

export default function Index({ userService, prisonerService, calculateReleaseDatesService }: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))
  const calculationAccessRoutes = new CalculationRoutes(calculateReleaseDatesService, prisonerService)
  const otherAccessRoutes = new OtherRoutes(calculateReleaseDatesService, prisonerService)

  const indexRoutes = () =>
    get('/', (req, res) => {
      res.render('pages/index')
    })

  const calculationRoutes = () => {
    get('/calculation/:nomsId/check-information', calculationAccessRoutes.checkInformation)
    post('/calculation/:nomsId/check-information', calculationAccessRoutes.submitCheckInformation)
    get('/calculation/:nomsId/summary/:calculationRequestId', calculationAccessRoutes.calculationSummary)
    get('/calculation/:nomsId/complete', calculationAccessRoutes.complete)
  }

  const otherRoutes = () => {
    get('/test/data', otherAccessRoutes.listTestData) // TODO remove this route as it was only for POC testing
    get('/test/calculation', otherAccessRoutes.testCalculation) // TODO remove this route as it was only for POC testing
    get('/prisoner/:nomsId/image', otherAccessRoutes.getPrisonerImage)
    get('/search/prisoners', otherAccessRoutes.searchPrisoners)
  }

  router.use(auth.authenticationMiddleware(tokenVerifier))
  router.use(populateCurrentUser(userService))
  router.use((req, res, next) => {
    if (typeof req.csrfToken === 'function') {
      res.locals.csrfToken = req.csrfToken()
    }
    next()
  })
  router.use(flashMessages())

  indexRoutes()
  calculationRoutes()
  otherRoutes()

  return router
}

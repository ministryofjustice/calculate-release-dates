import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { Services } from '../services'
import populateCurrentUser from '../middleware/populateCurrentUser'
import tokenVerifier from '../api/tokenVerification'
import auth from '../authentication/auth'
import OtherRoutes from './otherRoutes'

export default function Index({ userService, prisonerService, calculateReleaseDatesService }: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const otherAccessRoutes = new OtherRoutes(calculateReleaseDatesService, prisonerService)

  const indexRoutes = () =>
    get('/', (req, res) => {
      res.render('pages/index')
    })

  const otherRoutes = () => {
    get('/test/data', otherAccessRoutes.listTestData)
    get('/test/calculation', otherAccessRoutes.testCalculation)
    get('/prisoner/:nomsId/detail', otherAccessRoutes.getPrisonerDetail)
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

  indexRoutes()
  otherRoutes()

  return router
}

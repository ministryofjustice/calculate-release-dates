import type { RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'

export default function routes(router: Router, calculateReleaseDatesService: CalculateReleaseDatesService): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res, next) => {
    console.log('hello 1')
    console.log(`hello 1${JSON.stringify(res.locals.user)}`)
    const a = await calculateReleaseDatesService.getTestData(res.locals.user.token)
    console.log(`hello 2 XXX${JSON.stringify(a)}`)
    console.log(`hello 2${a}`)
    res.render('pages/index')
  })

  return router
}

import { Router } from 'express'
import { z } from 'zod'
import { Controller } from '../controller'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import { SchemaFactory, validate } from '../../middleware/validationMiddleware'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import StartApprovedDatesJourneyController from './start/startApprovedDatesJourneyController'
import ensureInApprovedDatesJourney from '../../middleware/approvedDatesMiddleware'

const StandaloneApprovedDatesRoutes = (calculateReleaseDatesService: CalculateReleaseDatesService) => {
  const router = Router({ mergeParams: true })
  const route = <P extends { [key: string]: string }>({
    path,
    controller,
    validateToSchema,
  }: {
    path: string
    controller: Controller
    validateToSchema?: z.ZodTypeAny | SchemaFactory<P>
  }) => {
    router.get(path, ensureInApprovedDatesJourney(), asyncMiddleware(controller.GET))
    if (controller.POST) {
      if (validateToSchema) {
        router.post(path, ensureInApprovedDatesJourney(), validate(validateToSchema), asyncMiddleware(controller.POST))
      } else {
        router.post(path, ensureInApprovedDatesJourney(), asyncMiddleware(controller.POST))
      }
    }
  }

  router.get(
    '/approved-dates/:nomsId/start',
    asyncMiddleware(new StartApprovedDatesJourneyController(calculateReleaseDatesService).GET),
  )

  route({
    path: '/approved-dates/:nomsId/review-calculated-dates/:journeyId',
    controller: new StartApprovedDatesJourneyController(calculateReleaseDatesService),
  })

  return router
}

export default StandaloneApprovedDatesRoutes

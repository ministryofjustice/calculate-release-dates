import { Router } from 'express'
import { z } from 'zod'
import { Controller } from '../controller'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import { SchemaFactory, validate } from '../../middleware/validationMiddleware'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import StartApprovedDatesJourneyController from './start/startApprovedDatesJourneyController'
import ensureInApprovedDatesJourney from '../../middleware/approvedDatesMiddleware'
import ReviewCalculatedDatesBeforeAddingApprovedDatesController from './review-calculated-dates/reviewCalculatedDatesBeforeAddingApprovedDatesController'
import PrisonerService from '../../services/prisonerService'
import DateTypeConfigurationService from '../../services/dateTypeConfigurationService'
import ReviewApprovedDatesController from './review-dates/reviewApprovedDatesController'
import SelectApprovedDatesController from './select-dates/selectApprovedDatesController'
import { selectDatesSchema } from '../common-schemas/selectDatesSchema'
import { releaseDateSchema } from '../common-schemas/releaseDateSchemas'
import AddApprovedDateController from './add-date/addApprovedDateController'

const StandaloneApprovedDatesRoutes = (
  calculateReleaseDatesService: CalculateReleaseDatesService,
  prisonerService: PrisonerService,
  dateTypeConfigurationService: DateTypeConfigurationService,
) => {
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
    controller: new ReviewCalculatedDatesBeforeAddingApprovedDatesController(
      calculateReleaseDatesService,
      prisonerService,
      dateTypeConfigurationService,
    ),
  })

  route({
    path: '/approved-dates/:nomsId/review-approved-dates/:journeyId',
    controller: new ReviewApprovedDatesController(
      calculateReleaseDatesService,
      prisonerService,
      dateTypeConfigurationService,
    ),
  })

  route({
    path: '/approved-dates/:nomsId/select-dates/:journeyId',
    controller: new SelectApprovedDatesController(dateTypeConfigurationService, prisonerService),
    validateToSchema: selectDatesSchema,
  })

  route({
    path: '/approved-dates/:nomsId/:dateType/add/:journeyId',
    controller: new AddApprovedDateController(dateTypeConfigurationService, prisonerService),
    validateToSchema: releaseDateSchema,
  })

  return router
}

export default StandaloneApprovedDatesRoutes

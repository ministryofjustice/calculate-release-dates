import { Router } from 'express'
import { z } from 'zod'
import { Controller } from '../controller'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import SelectGenuineOverrideReasonController from './select-genuine-override-reason/selectGenuineOverrideReasonController'
import { SchemaFactory, validate } from '../../middleware/validationMiddleware'
import { selectGenuineOverrideReasonSchemaFactory } from './select-genuine-override-reason/selectGenuineOverrideReasonSchemas'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import PrisonerService from '../../services/prisonerService'
import ReviewDatesForGenuineOverrideController from './review-dates/reviewDatesForGenuineOverrideController'
import DateTypeConfigurationService from '../../services/dateTypeConfigurationService'
import GenuineOverrideSelectDatesController from './select-dates/genuineOverrideSelectDatesController'
import { genuineOverrideSelectDatesSchema } from './select-dates/genuineOverrideSelectDatesSchema'
import AddGenuineOverrideDateController from './add-date/addGenuineOverrideDateController'
import { releaseDateSchema } from '../common-schemas/releaseDateSchemas'

const GenuineOverridesRoutes = (
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
    router.get(path, asyncMiddleware(controller.GET))
    if (controller.POST) {
      if (validateToSchema) {
        router.post(path, validate(validateToSchema), asyncMiddleware(controller.POST))
      } else {
        router.post(path, asyncMiddleware(controller.POST))
      }
    }
  }

  route({
    path: '/calculation/:nomsId/select-reason-for-override/:calculationRequestId',
    controller: new SelectGenuineOverrideReasonController(calculateReleaseDatesService, prisonerService),
    validateToSchema: selectGenuineOverrideReasonSchemaFactory,
  })

  route({
    path: '/calculation/:nomsId/review-dates-for-override/:calculationRequestId',
    controller: new ReviewDatesForGenuineOverrideController(
      calculateReleaseDatesService,
      prisonerService,
      dateTypeConfigurationService,
    ),
  })

  route({
    path: '/calculation/:nomsId/override/select-dates/:calculationRequestId',
    controller: new GenuineOverrideSelectDatesController(dateTypeConfigurationService, prisonerService),
    validateToSchema: genuineOverrideSelectDatesSchema,
  })

  route({
    path: '/calculation/:nomsId/override/:dateType/add/:calculationRequestId',
    controller: new AddGenuineOverrideDateController(dateTypeConfigurationService, prisonerService),
    validateToSchema: releaseDateSchema,
  })

  return router
}

export default GenuineOverridesRoutes

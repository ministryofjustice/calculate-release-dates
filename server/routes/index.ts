import { Router } from 'express'
import { z } from 'zod'
import { Services } from '../services'
import CalculationRoutes from './calculationRoutes'
import ManualEntryRoutes from './manualEntryRoutes'
import comparePaths from './comparePaths'
import ApprovedDatesRoutes from './approvedDatesRoutes'
import ThingsToDoInterceptController from './things-to-do-intercept/thingsToDoInterceptController'
import GenuineOverridesRoutes from './genuine-overrides/genuineOverridesRoutes'
import CalculationSummaryController from './calculation-summary/calculationSummaryController'
import { SchemaFactory, validate } from '../middleware/validationMiddleware'
import { calculationSummarySchema } from './calculation-summary/calculationSummarySchema'
import CheckInformationController from './check-information/checkInformationController'
import { Controller } from './controller'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { checkInformationSchema } from './check-information/checkInformationSchema'
import MultipleConsecutiveToInterceptController from './multiple-consecutive-to-intercept/multipleConsecutiveToInterceptController'
import PreviouslyRecordedSledInterceptController from './previously-recorded-sled-intercept/previouslyRecordedSledInterceptController'
import { previouslyRecordedSledSchema } from './previously-recorded-sled-intercept/previouslyRecordedSledSchema'
import StandaloneApprovedDatesRoutes from './approved-dates/standaloneApprovedDatesRoutes'
import CalculationReasonController from './calculation-reason/calculationReasonController'
import { calculationReasonSchemaFactory } from './calculation-reason/calculationReasonSchemaFactory'
import DisableNomisController from './disable-nomis/disableNomisController'
import CalculationSummaryOverridesController from './calculation-summary/calculationSummaryOverridesController'
import config from '../config'
import StartController from './start/startController'
import SupportedSentencesController from './start/supportedSentencesController'
import AccessibilityController from './start/accessibilityController'
import ViewJourneyController from './view/ViewJourneyController'
import ViewCalculationSummaryController from './view/ViewCalculationSummaryController'
import ViewPrintCalculationSummaryController from './view/ViewPrintCalculationSummaryController'
import ViewPrintNotificationSlipController from './view/ViewPrintNotificationSlipController'
import ViewSentencesAndOffencesController from './view/ViewSentencesAndOffencesController'
import ViewNomisCalculationSummaryController from './view/ViewNomisCalculationSummaryController'
import OtherController from './other/otherController'
import CompareIndexController from './compare/CompareIndexController'
import CompareChooseController from './compare/CompareChooseController'
import CompareListController from './compare/CompareListController'
import CompareManualListController from './compare/CompareManualListController'
import CompareResultController from './compare/CompareResultController'
import CompareManualResultController from './compare/CompareManualResultController'
import CompareRunController from './compare/CompareRunController'
import CompareDetailController from './compare/CompareDetailController'
import CompareJsonController from './compare/CompareJsonController'
import CompareManualDetailController from './compare/CompareManualDetailController'
import CompareManualJsonController from './compare/CompareManualJsonController'
import CompareManualCalculationController from './compare/CompareManualCalculationController'
import CompareSubmitManualCalculationController from './compare/CompareSubmitManualCalculationController'

export default function Index({
  prisonerService,
  calculateReleaseDatesService,
  viewReleaseDatesService,
  userInputService,
  manualCalculationService,
  manualEntryService,
  userPermissionsService,
  approvedDatesService,
  checkInformationService,
  comparisonService,
  courtCasesReleaseDatesService,
  dateTypeConfigurationService,
  dateValidationService,
}: Services): Router {
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
  const calculationAccessRoutes = new CalculationRoutes(calculateReleaseDatesService, prisonerService, userInputService)

  const compareIndexController = new CompareIndexController(userPermissionsService)
  const compareChooseController = new CompareChooseController(userPermissionsService, prisonerService)
  const compareListController = new CompareListController(userPermissionsService, comparisonService)
  const compareManualListController = new CompareManualListController(userPermissionsService, comparisonService)
  const compareResultController = new CompareResultController(userPermissionsService, comparisonService)
  const compareManualResultController = new CompareManualResultController(userPermissionsService, comparisonService)
  const compareRunController = new CompareRunController(comparisonService)
  const compareDetailController = new CompareDetailController(comparisonService)
  const compareJsonController = new CompareJsonController(comparisonService, calculateReleaseDatesService)
  const compareManualDetailController = new CompareManualDetailController(comparisonService)
  const compareManualJsonController = new CompareManualJsonController(comparisonService, calculateReleaseDatesService)
  const compareManualCalculationController = new CompareManualCalculationController()
  const compareSubmitManualCalculationController = new CompareSubmitManualCalculationController(comparisonService)

  const startController = new StartController(
    calculateReleaseDatesService,
    prisonerService,
    userPermissionsService,
    courtCasesReleaseDatesService,
  )
  const supportedSentencesController = new SupportedSentencesController()
  const accessibilityController = new AccessibilityController()
  const viewJourneyController = new ViewJourneyController(prisonerService, viewReleaseDatesService)
  const viewCalculationSummaryController = new ViewCalculationSummaryController(
    calculateReleaseDatesService,
    prisonerService,
  )
  const viewCalculationSummaryOverridesController = new CalculationSummaryOverridesController(
    calculateReleaseDatesService,
    prisonerService,
  )
  const viewPrintCalculationSummaryController = new ViewPrintCalculationSummaryController(
    viewReleaseDatesService,
    calculateReleaseDatesService,
    prisonerService,
  )
  const viewPrintNotificationSlipController = new ViewPrintNotificationSlipController(
    viewReleaseDatesService,
    calculateReleaseDatesService,
    prisonerService,
  )
  const viewSentencesAndOffencesController = new ViewSentencesAndOffencesController(
    viewReleaseDatesService,
    calculateReleaseDatesService,
    prisonerService,
  )
  const viewNomisCalculationSummaryController = new ViewNomisCalculationSummaryController(
    calculateReleaseDatesService,
    prisonerService,
  )

  const manualEntryAccessRoutes = new ManualEntryRoutes(
    calculateReleaseDatesService,
    prisonerService,
    manualCalculationService,
    manualEntryService,
  )

  const approvedDatesAccessRoutes = new ApprovedDatesRoutes(
    prisonerService,
    approvedDatesService,
    manualEntryService,
    calculateReleaseDatesService,
  )

  const indexRoutes = () => {
    route({ path: '/', controller: startController })
    route({ path: '/supported-sentences', controller: supportedSentencesController })
    route({ path: '/supported-sentences/:nomsId', controller: supportedSentencesController })
    route({ path: '/accessibility', controller: accessibilityController })
  }

  const checkInformationController = new CheckInformationController(
    calculateReleaseDatesService,
    prisonerService,
    checkInformationService,
    userInputService,
  )
  const checkInformationRoutes = () => {
    route({
      path: '/calculation/:nomsId/check-information',
      controller: checkInformationController,
      validateToSchema: checkInformationSchema,
    })
  }

  const manualEntryRoutes = () => {
    router.get('/calculation/:nomsId/manual-entry', manualEntryAccessRoutes.landingPage)
    router.get('/calculation/:nomsId/manual-entry/select-dates', manualEntryAccessRoutes.dateSelection)
    router.post('/calculation/:nomsId/manual-entry/select-dates', manualEntryAccessRoutes.submitSelectedDates)
    router.get('/calculation/:nomsId/manual-entry/enter-date', manualEntryAccessRoutes.enterDate)
    router.post('/calculation/:nomsId/manual-entry/enter-date', manualEntryAccessRoutes.submitDate)
    router.get('/calculation/:nomsId/manual-entry/confirmation', manualEntryAccessRoutes.loadConfirmation)
    router.post('/calculation/:nomsId/manual-entry/confirmation', manualEntryAccessRoutes.loadConfirmationSubmit)
    router.get('/calculation/:nomsId/manual-entry/remove-date', manualEntryAccessRoutes.loadRemoveDate)
    router.post('/calculation/:nomsId/manual-entry/remove-date', manualEntryAccessRoutes.submitRemoveDate)
    router.get('/calculation/:nomsId/manual-entry/save', manualEntryAccessRoutes.save)
    router.get('/calculation/:nomsId/manual-entry/no-dates-confirmation', manualEntryAccessRoutes.noDatesConfirmation)
    router.post(
      '/calculation/:nomsId/manual-entry/no-dates-confirmation',
      manualEntryAccessRoutes.submitNoDatesConfirmation,
    )
  }

  const calculationSummaryController = new CalculationSummaryController(calculateReleaseDatesService, prisonerService)

  const approvedDatesRoutes = () => {
    // routes integrated into the regular calculation journey
    router.get(
      '/calculation/:nomsId/:calculationRequestId/approved-dates-question',
      approvedDatesAccessRoutes.askApprovedDatesQuestion,
    )
    router.post(
      '/calculation/:nomsId/:calculationRequestId/approved-dates-question',
      approvedDatesAccessRoutes.submitApprovedDatesQuestion,
    )
    router.get(
      '/calculation/:nomsId/:calculationRequestId/select-approved-dates',
      approvedDatesAccessRoutes.selectApprovedDateTypes,
    )
    router.post(
      '/calculation/:nomsId/:calculationRequestId/select-approved-dates',
      approvedDatesAccessRoutes.submitApprovedDateTypes,
    )
    router.get('/calculation/:nomsId/:calculationRequestId/submit-dates', approvedDatesAccessRoutes.loadSubmitDates)
    router.post('/calculation/:nomsId/:calculationRequestId/submit-dates', approvedDatesAccessRoutes.storeSubmitDates)
    router.get('/calculation/:nomsId/:calculationRequestId/confirmation', calculationSummaryController.GET)
    router.post(
      '/calculation/:nomsId/:calculationRequestId/confirmation',
      validate(calculationSummarySchema),
      calculationSummaryController.POST,
    )
    router.get('/calculation/:nomsId/:calculationRequestId/remove', approvedDatesAccessRoutes.loadRemoveDate)
    router.post('/calculation/:nomsId/:calculationRequestId/remove', approvedDatesAccessRoutes.submitRemoveDate)

    // routes for standalone journey
    router.use(
      '/',
      StandaloneApprovedDatesRoutes(calculateReleaseDatesService, prisonerService, dateTypeConfigurationService),
    )
  }

  const calculationRoutes = () => {
    router.get('/calculation/:nomsId/summary/:calculationRequestId', calculationSummaryController.GET)
    router.post(
      '/calculation/:nomsId/summary/:calculationRequestId',
      validate(calculationSummarySchema),
      calculationSummaryController.POST,
    )
    route({
      path: '/calculation/:nomsId/summary/:calculationRequestId/printNotificationSlip',
      controller: viewPrintNotificationSlipController,
    })
    router.get(
      '/calculation/:nomsId/summary/:calculationRequestId/print',
      calculationAccessRoutes.printCalculationSummary,
    )
    router.get('/calculation/:nomsId/complete/:calculationRequestId', calculationAccessRoutes.complete)
    router.get('/calculation/:nomsId/cancelCalculation', calculationAccessRoutes.askCancelQuestion)
    router.post('/calculation/:nomsId/cancelCalculation', calculationAccessRoutes.submitCancelQuestion)
    route({
      path: '/calculation/:nomsId/concurrent-consecutive',
      controller: new MultipleConsecutiveToInterceptController(
        calculateReleaseDatesService,
        prisonerService,
        userInputService,
      ),
    })
    route({
      path: '/calculation/:nomsId/previously-recorded-sled-intercept/:calculationRequestId',
      controller: new PreviouslyRecordedSledInterceptController(
        calculateReleaseDatesService,
        prisonerService,
        userInputService,
      ),
      validateToSchema: previouslyRecordedSledSchema,
    })
  }

  const reasonRoutes = () => {
    route({
      path: '/calculation/:nomsId/reason',
      controller: new CalculationReasonController(
        calculateReleaseDatesService,
        prisonerService,
        courtCasesReleaseDatesService,
      ),
      validateToSchema: calculationReasonSchemaFactory,
    })
  }

  const viewRoutes = () => {
    route({
      path: '/view/:nomsId/latest',
      controller: viewJourneyController,
    })
    route({
      path: '/view/:nomsId/sentences-and-offences/:calculationRequestId',
      controller: viewSentencesAndOffencesController,
    })
    route({
      path: '/view/:nomsId/nomis-calculation-summary/:offenderSentCalculationId',
      controller: viewNomisCalculationSummaryController,
    })
    route({
      path: '/view/:nomsId/calculation-summary/:calculationRequestId',
      controller: viewCalculationSummaryController,
    })
    route({
      path: '/view/:nomsId/calculation-summary/:calculationRequestId/overrides',
      controller: viewCalculationSummaryOverridesController,
    })
    route({
      path: '/view/:nomsId/calculation-summary/:calculationRequestId/print',
      controller: viewPrintCalculationSummaryController,
    })
    route({
      path: '/view/:nomsId/calculation-summary/:calculationRequestId/printNotificationSlip',
      controller: viewPrintNotificationSlipController,
    })
  }

  const otherRoutes = () => {
    route({
      path: '/prisoner/:nomsId/image',
      controller: new OtherController(prisonerService),
    })
  }

  const compareRoutes = () => {
    route({ path: comparePaths.COMPARE_INDEX, controller: compareIndexController })
    route({ path: comparePaths.COMPARE_MANUAL, controller: compareManualCalculationController })
    route({ path: comparePaths.COMPARE_RUN, controller: compareRunController })
    route({ path: comparePaths.COMPARE_CHOOSE, controller: compareChooseController })
    route({ path: comparePaths.COMPARE_RESULT, controller: compareResultController })
    route({ path: comparePaths.COMPARE_DETAIL, controller: compareDetailController })
    route({ path: comparePaths.COMPARE_DETAIL_JSON, controller: compareJsonController })
    route({ path: comparePaths.COMPARE_LIST, controller: compareListController })
    route({ path: comparePaths.COMPARE_MANUAL_LIST, controller: compareManualListController })
    route({ path: comparePaths.COMPARE_MANUAL_RESULT, controller: compareManualResultController })
    route({ path: comparePaths.COMPARE_MANUAL_DETAIL, controller: compareManualDetailController })
    route({ path: comparePaths.COMPARE_MANUAL_DETAIL_JSON, controller: compareManualJsonController })
    route({ path: comparePaths.COMPARE_MANUAL, controller: compareSubmitManualCalculationController })
  }

  const thingsToDoInterceptRouter = () => {
    route({
      path: '/calculation/:nomsId/things-to-do-before-calculation',
      controller: new ThingsToDoInterceptController(prisonerService, courtCasesReleaseDatesService),
    })
  }

  const genuineOverridesRoutes = () => {
    router.use(
      '/',
      GenuineOverridesRoutes(
        calculateReleaseDatesService,
        prisonerService,
        dateTypeConfigurationService,
        dateValidationService,
      ),
    )
  }

  const disableNomisRoutes = () => {
    route({
      path: '/disable-nomis',
      controller: new DisableNomisController(calculateReleaseDatesService),
    })
  }

  indexRoutes()
  calculationRoutes()
  reasonRoutes()
  checkInformationRoutes()
  manualEntryRoutes()
  viewRoutes()
  otherRoutes()
  compareRoutes()
  approvedDatesRoutes()
  thingsToDoInterceptRouter()
  genuineOverridesRoutes()

  router.get('/search/prisoners', (_req, res) => {
    res.redirect(config.apis.digitalPrisonServices.ui_url)
  })

  disableNomisRoutes()
  return router
}

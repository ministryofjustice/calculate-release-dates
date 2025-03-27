import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { Services } from '../services'
import OtherRoutes from './otherRoutes'
import CalculationRoutes from './calculationRoutes'
import SearchRoutes from './searchRoutes'
import StartRoutes from './startRoutes'
import CheckInformationRoutes from './checkInformationRoutes'
import ViewRoutes from './viewRoutes'
import CalculationQuestionRoutes from './calculationQuestionRoutes'
import ManualEntryRoutes from './manualEntryRoutes'
import CompareRoutes, { comparePaths } from './compareRoutes'
import ApprovedDatesRoutes from './approvedDatesRoutes'
import GenuineOverrideRoutes from './genuineOverrideRoutes'
import GenuineOverridesEmailTemplateService from '../services/genuineOverridesEmailTemplateService'
import ThingsToDoInterceptRoutes from './thingsToDoInterceptRoutes'
import config from '../config'

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
}: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))
  const calculationAccessRoutes = new CalculationRoutes(
    calculateReleaseDatesService,
    prisonerService,
    userInputService,
    userPermissionsService,
  )
  const checkInformationAccessRoutes = new CheckInformationRoutes(
    calculateReleaseDatesService,
    prisonerService,
    userInputService,
    checkInformationService,
  )
  const searchAccessRoutes = new SearchRoutes(prisonerService)

  const compareAccessRoutes = new CompareRoutes(
    calculateReleaseDatesService,
    userPermissionsService,
    prisonerService,
    comparisonService,
  )

  const otherAccessRoutes = new OtherRoutes(prisonerService)
  const startRoutes = new StartRoutes(
    calculateReleaseDatesService,
    prisonerService,
    userPermissionsService,
    courtCasesReleaseDatesService,
  )
  const viewAccessRoutes = new ViewRoutes(viewReleaseDatesService, calculateReleaseDatesService, prisonerService)

  const calculationQuestionRoutes = new CalculationQuestionRoutes(
    calculateReleaseDatesService,
    prisonerService,
    courtCasesReleaseDatesService,
  )

  const manualEntryAccessRoutes = new ManualEntryRoutes(
    calculateReleaseDatesService,
    prisonerService,
    manualCalculationService,
    manualEntryService,
  )

  const approvedDatesAccessRoutes = new ApprovedDatesRoutes(prisonerService, approvedDatesService, manualEntryService)
  const genuineOverridesEmailTemplateService = new GenuineOverridesEmailTemplateService()
  const genuineOverrideAccessRoutes = new GenuineOverrideRoutes(
    userPermissionsService,
    prisonerService,
    calculateReleaseDatesService,
    checkInformationService,
    userInputService,
    manualEntryService,
    manualCalculationService,
    genuineOverridesEmailTemplateService,
  )
  const thingsToDoInterceptRoutes = new ThingsToDoInterceptRoutes(prisonerService, courtCasesReleaseDatesService)

  const indexRoutes = () => {
    get('/', startRoutes.startPage)
    get('/supported-sentences', startRoutes.supportedSentences)
    get('/supported-sentences/:nomsId', startRoutes.supportedSentences)
    get('/accessibility', startRoutes.accessibility)
  }

  const checkInformationRoutes = () => {
    get('/calculation/:nomsId/check-information', checkInformationAccessRoutes.checkInformation)
    post('/calculation/:nomsId/check-information', checkInformationAccessRoutes.submitCheckInformation)
  }

  const manualEntryRoutes = () => {
    get('/calculation/:nomsId/check-information-unsupported', checkInformationAccessRoutes.unsupportedCheckInformation)
    post(
      '/calculation/:nomsId/check-information-unsupported',
      checkInformationAccessRoutes.submitUnsupportedCheckInformation,
    )
    get('/calculation/:nomsId/manual-entry', manualEntryAccessRoutes.landingPage)
    get('/calculation/:nomsId/manual-entry/select-dates', manualEntryAccessRoutes.dateSelection)
    post('/calculation/:nomsId/manual-entry/select-dates', manualEntryAccessRoutes.submitSelectedDates)
    get('/calculation/:nomsId/manual-entry/enter-date', manualEntryAccessRoutes.enterDate)
    post('/calculation/:nomsId/manual-entry/enter-date', manualEntryAccessRoutes.submitDate)
    get('/calculation/:nomsId/manual-entry/confirmation', manualEntryAccessRoutes.loadConfirmation)
    get('/calculation/:nomsId/manual-entry/remove-date', manualEntryAccessRoutes.loadRemoveDate)
    post('/calculation/:nomsId/manual-entry/remove-date', manualEntryAccessRoutes.submitRemoveDate)
    get('/calculation/:nomsId/manual-entry/change-date', manualEntryAccessRoutes.loadChangeDate)
    get('/calculation/:nomsId/manual-entry/save', manualEntryAccessRoutes.save)
    get('/calculation/:nomsId/manual-entry/no-dates-confirmation', manualEntryAccessRoutes.noDatesConfirmation)
    post('/calculation/:nomsId/manual-entry/no-dates-confirmation', manualEntryAccessRoutes.submitNoDatesConfirmation)
  }

  const approvedDatesRoutes = () => {
    get(
      '/calculation/:nomsId/:calculationRequestId/approved-dates-question',
      approvedDatesAccessRoutes.askApprovedDatesQuestion,
    )
    post(
      '/calculation/:nomsId/:calculationRequestId/approved-dates-question',
      approvedDatesAccessRoutes.submitApprovedDatesQuestion,
    )
    get('/calculation/:nomsId/:calculationRequestId/store', calculationAccessRoutes.submitCalculationSummary)
    get(
      '/calculation/:nomsId/:calculationRequestId/select-approved-dates',
      approvedDatesAccessRoutes.selectApprovedDateTypes,
    )
    post(
      '/calculation/:nomsId/:calculationRequestId/select-approved-dates',
      approvedDatesAccessRoutes.submitApprovedDateTypes,
    )
    get('/calculation/:nomsId/:calculationRequestId/submit-dates', approvedDatesAccessRoutes.loadSubmitDates)
    post('/calculation/:nomsId/:calculationRequestId/submit-dates', approvedDatesAccessRoutes.storeSubmitDates)
    get('/calculation/:nomsId/:calculationRequestId/confirmation', calculationAccessRoutes.calculationSummary)
    post('/calculation/:nomsId/:calculationRequestId/confirmation', calculationAccessRoutes.submitCalculationSummary)
    get('/calculation/:nomsId/:calculationRequestId/change', approvedDatesAccessRoutes.loadChangeDate)
    get('/calculation/:nomsId/:calculationRequestId/remove', approvedDatesAccessRoutes.loadRemoveDate)
    post('/calculation/:nomsId/:calculationRequestId/remove', approvedDatesAccessRoutes.submitRemoveDate)
  }
  const calculationRoutes = () => {
    get('/calculation/:nomsId/summary/:calculationRequestId', calculationAccessRoutes.calculationSummary)
    post('/calculation/:nomsId/summary/:calculationRequestId', calculationAccessRoutes.submitCalculationSummary)
    get(
      '/calculation/:nomsId/summary/:calculationRequestId/printNotificationSlip',
      viewAccessRoutes.printNotificationSlip,
    )
    get('/calculation/:nomsId/summary/:calculationRequestId/print', calculationAccessRoutes.printCalculationSummary)
    get('/calculation/:nomsId/complete/:calculationRequestId', calculationAccessRoutes.complete)
    get('/calculation/:nomsId/cancelCalculation', calculationAccessRoutes.askCancelQuestion)
    post('/calculation/:nomsId/cancelCalculation', calculationAccessRoutes.submitCancelQuestion)
    get('/calculation/:nomsId/concurrent-consecutive', calculationAccessRoutes.concurrentConsecutive)
    post('/calculation/:nomsId/concurrent-consecutive', calculationAccessRoutes.confirmConcurrentConsecutive)
  }

  const reasonRoutes = () => {
    get('/calculation/:nomsId/reason', calculationQuestionRoutes.selectCalculationReason)
    post('/calculation/:nomsId/reason', calculationQuestionRoutes.submitCalculationReason)
  }

  const searchRoutes = () => {
    get('/search/prisoners', searchAccessRoutes.searchCalculatePrisoners)
  }

  const viewRoutes = () => {
    get('/view/:nomsId/latest', viewAccessRoutes.startViewJourney)
    get('/view/:nomsId/sentences-and-offences/:calculationRequestId', viewAccessRoutes.sentencesAndOffences)
    get('/view/:nomsId/nomis-calculation-summary/:offenderSentCalculationId', viewAccessRoutes.nomisCalculationSummary)
    get('/view/:nomsId/calculation-summary/:calculationRequestId', viewAccessRoutes.calculationSummary)
    get('/view/:nomsId/calculation-summary/:calculationRequestId/print', viewAccessRoutes.printCalculationSummary)
    get(
      '/view/:nomsId/calculation-summary/:calculationRequestId/printNotificationSlip',
      viewAccessRoutes.printNotificationSlip,
    )
  }

  const otherRoutes = () => {
    get('/prisoner/:nomsId/image', otherAccessRoutes.getPrisonerImage)
  }

  let specialistSupportRoutes = () => {}
  if (config.featureToggles.genuineOverrides) {
    specialistSupportRoutes = () => {
      get(
        '/calculation/:calculationReference/request-support',
        genuineOverrideAccessRoutes.loadGenuineOverrideRequestPage,
      )
      get('/specialist-support/', genuineOverrideAccessRoutes.startPage)
      get('/specialist-support/search/', genuineOverrideAccessRoutes.loadSearch)
      post('/specialist-support/search/', genuineOverrideAccessRoutes.submitSearch)
      get('/specialist-support/calculation/:calculationReference', genuineOverrideAccessRoutes.loadConfirmPage)
      post('/specialist-support/calculation/:calculationReference', genuineOverrideAccessRoutes.submitConfirmPage)
      get(
        '/specialist-support/calculation/:calculationReference/sentence-and-offence-information',
        genuineOverrideAccessRoutes.loadCheckSentenceAndInformationPage,
      )
      post(
        '/specialist-support/calculation/:calculationReference/sentence-and-offence-information',
        genuineOverrideAccessRoutes.submitCheckSentenceAndInformationPage,
      )
      get(
        '/specialist-support/calculation/:calculationReference/summary/:calculationRequestId',
        genuineOverrideAccessRoutes.loadCalculationPage,
      )
      post(
        '/specialist-support/calculation/:calculationReference/summary/:calculationRequestId',
        genuineOverrideAccessRoutes.submitCalculationPage,
      )
      get(
        '/specialist-support/calculation/:calculationReference/complete',
        genuineOverrideAccessRoutes.loadConfirmationPage,
      )
      get('/specialist-support/calculation/:calculationReference/reason', genuineOverrideAccessRoutes.loadReasonPage)
      post('/specialist-support/calculation/:calculationReference/reason', genuineOverrideAccessRoutes.submitReasonPage)
      get(
        '/specialist-support/calculation/:calculationReference/select-date-types',
        genuineOverrideAccessRoutes.loadSelectDatesPage,
      )
      post(
        '/specialist-support/calculation/:calculationReference/select-date-types',
        genuineOverrideAccessRoutes.submitSelectDatesPage,
      )
      get(
        '/specialist-support/calculation/:calculationReference/enter-date',
        genuineOverrideAccessRoutes.loadEnterDatePage,
      )
      post(
        '/specialist-support/calculation/:calculationReference/enter-date',
        genuineOverrideAccessRoutes.submitEnterDatePage,
      )
      get(
        '/specialist-support/calculation/:calculationReference/confirm-override',
        genuineOverrideAccessRoutes.loadConfirmOverridePage,
      )
      post(
        '/specialist-support/calculation/:calculationReference/confirm-override',
        genuineOverrideAccessRoutes.submitConfirmOverridePage,
      )
      get(
        '/specialist-support/calculation/:calculationReference/remove-date',
        genuineOverrideAccessRoutes.loadRemoveDate,
      )
      post(
        '/specialist-support/calculation/:calculationReference/remove-date',
        genuineOverrideAccessRoutes.submitRemoveDate,
      )
      get(
        '/specialist-support/calculation/:calculationReference/change-date',
        genuineOverrideAccessRoutes.loadChangeDate,
      )
    }
  }

  const compareRoutes = () => {
    get(comparePaths.COMPARE_INDEX, compareAccessRoutes.index)
    get(comparePaths.COMPARE_MANUAL, compareAccessRoutes.manualCalculation) // TODO remove this route as it was only for testing
    post(comparePaths.COMPARE_MANUAL, compareAccessRoutes.submitManualCalculation) // TODO remove this route as it was only for testing
    post(comparePaths.COMPARE_RUN, compareAccessRoutes.run)
    get(comparePaths.COMPARE_CHOOSE, compareAccessRoutes.choose)
    get(comparePaths.COMPARE_RESULT, compareAccessRoutes.result)
    get(comparePaths.COMPARE_DETAIL, compareAccessRoutes.detail)
    post(comparePaths.COMPARE_DETAIL, compareAccessRoutes.submitDetail)
    get(comparePaths.COMPARE_DETAIL_JSON, compareAccessRoutes.viewJson)
    get(comparePaths.COMPARE_LIST, compareAccessRoutes.list)
    get(comparePaths.COMPARE_MANUAL_LIST, compareAccessRoutes.manual_list)
    get(comparePaths.COMPARE_MANUAL_RESULT, compareAccessRoutes.manualResult)
    get(comparePaths.COMPARE_MANUAL_DETAIL, compareAccessRoutes.manualDetail)
    post(comparePaths.COMPARE_MANUAL_DETAIL, compareAccessRoutes.submitManualDetail)
  }

  const thingsToDoInterceptRouter = () => {
    get('/calculation/:nomsId/things-to-do-before-calculation', thingsToDoInterceptRoutes.thingsToDoIntercept)
  }

  indexRoutes()
  calculationRoutes()
  reasonRoutes()
  checkInformationRoutes()
  manualEntryRoutes()
  searchRoutes()
  viewRoutes()
  otherRoutes()
  compareRoutes()
  approvedDatesRoutes()
  specialistSupportRoutes()
  thingsToDoInterceptRouter()
  return router
}

import { Router } from 'express'
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
import ThingsToDoInterceptRoutes from './thingsToDoInterceptRoutes'
import GenuineOverridesRoutes from './genuine-overrides/genuineOverridesRoutes'

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
  const thingsToDoInterceptRoutes = new ThingsToDoInterceptRoutes(prisonerService, courtCasesReleaseDatesService)

  const indexRoutes = () => {
    router.get('/', startRoutes.startPage)
    router.get('/supported-sentences', startRoutes.supportedSentences)
    router.get('/supported-sentences/:nomsId', startRoutes.supportedSentences)
    router.get('/accessibility', startRoutes.accessibility)
  }

  const checkInformationRoutes = () => {
    router.get('/calculation/:nomsId/check-information', checkInformationAccessRoutes.checkInformation)
    router.post('/calculation/:nomsId/check-information', checkInformationAccessRoutes.submitCheckInformation)
  }

  const manualEntryRoutes = () => {
    router.get(
      '/calculation/:nomsId/check-information-unsupported',
      checkInformationAccessRoutes.unsupportedCheckInformation,
    )
    router.post(
      '/calculation/:nomsId/check-information-unsupported',
      checkInformationAccessRoutes.submitUnsupportedCheckInformation,
    )
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

  const approvedDatesRoutes = () => {
    router.get(
      '/calculation/:nomsId/:calculationRequestId/approved-dates-question',
      approvedDatesAccessRoutes.askApprovedDatesQuestion,
    )
    router.post(
      '/calculation/:nomsId/:calculationRequestId/approved-dates-question',
      approvedDatesAccessRoutes.submitApprovedDatesQuestion,
    )
    router.get('/calculation/:nomsId/:calculationRequestId/store', calculationAccessRoutes.submitCalculationSummary)
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
    router.get('/calculation/:nomsId/:calculationRequestId/confirmation', calculationAccessRoutes.calculationSummary)
    router.post(
      '/calculation/:nomsId/:calculationRequestId/confirmation',
      calculationAccessRoutes.submitCalculationSummary,
    )
    router.get('/calculation/:nomsId/:calculationRequestId/remove', approvedDatesAccessRoutes.loadRemoveDate)
    router.post('/calculation/:nomsId/:calculationRequestId/remove', approvedDatesAccessRoutes.submitRemoveDate)
  }

  const calculationRoutes = () => {
    router.get('/calculation/:nomsId/summary/:calculationRequestId', calculationAccessRoutes.calculationSummary)
    router.post('/calculation/:nomsId/summary/:calculationRequestId', calculationAccessRoutes.submitCalculationSummary)
    router.get(
      '/calculation/:nomsId/summary/:calculationRequestId/printNotificationSlip',
      viewAccessRoutes.printNotificationSlip,
    )
    router.get(
      '/calculation/:nomsId/summary/:calculationRequestId/print',
      calculationAccessRoutes.printCalculationSummary,
    )
    router.get('/calculation/:nomsId/complete/:calculationRequestId', calculationAccessRoutes.complete)
    router.get('/calculation/:nomsId/cancelCalculation', calculationAccessRoutes.askCancelQuestion)
    router.post('/calculation/:nomsId/cancelCalculation', calculationAccessRoutes.submitCancelQuestion)
    router.get('/calculation/:nomsId/concurrent-consecutive', calculationAccessRoutes.concurrentConsecutive)
    router.post('/calculation/:nomsId/concurrent-consecutive', calculationAccessRoutes.confirmConcurrentConsecutive)
  }

  const reasonRoutes = () => {
    router.get('/calculation/:nomsId/reason', calculationQuestionRoutes.selectCalculationReason)
    router.post('/calculation/:nomsId/reason', calculationQuestionRoutes.submitCalculationReason)
  }

  const searchRoutes = () => {
    router.get('/search/prisoners', searchAccessRoutes.searchCalculatePrisoners)
  }

  const viewRoutes = () => {
    router.get('/view/:nomsId/latest', viewAccessRoutes.startViewJourney)
    router.get('/view/:nomsId/sentences-and-offences/:calculationRequestId', viewAccessRoutes.sentencesAndOffences)
    router.get(
      '/view/:nomsId/nomis-calculation-summary/:offenderSentCalculationId',
      viewAccessRoutes.nomisCalculationSummary,
    )
    router.get('/view/:nomsId/calculation-summary/:calculationRequestId', viewAccessRoutes.calculationSummary)
    router.get(
      '/view/:nomsId/calculation-summary/:calculationRequestId/print',
      viewAccessRoutes.printCalculationSummary,
    )
    router.get(
      '/view/:nomsId/calculation-summary/:calculationRequestId/printNotificationSlip',
      viewAccessRoutes.printNotificationSlip,
    )
  }

  const otherRoutes = () => {
    router.get('/prisoner/:nomsId/image', otherAccessRoutes.getPrisonerImage)
  }

  const compareRoutes = () => {
    router.get(comparePaths.COMPARE_INDEX, compareAccessRoutes.index)
    router.get(comparePaths.COMPARE_MANUAL, compareAccessRoutes.manualCalculation) // TODO remove this route as it was only for testing
    router.post(comparePaths.COMPARE_MANUAL, compareAccessRoutes.submitManualCalculation) // TODO remove this route as it was only for testing
    router.post(comparePaths.COMPARE_RUN, compareAccessRoutes.run)
    router.get(comparePaths.COMPARE_CHOOSE, compareAccessRoutes.choose)
    router.get(comparePaths.COMPARE_RESULT, compareAccessRoutes.result)
    router.get(comparePaths.COMPARE_DETAIL, compareAccessRoutes.detail)
    router.post(comparePaths.COMPARE_DETAIL, compareAccessRoutes.submitDetail)
    router.get(comparePaths.COMPARE_DETAIL_JSON, compareAccessRoutes.viewJson)
    router.get(comparePaths.COMPARE_LIST, compareAccessRoutes.list)
    router.get(comparePaths.COMPARE_MANUAL_LIST, compareAccessRoutes.manual_list)
    router.get(comparePaths.COMPARE_MANUAL_RESULT, compareAccessRoutes.manualResult)
    router.get(comparePaths.COMPARE_MANUAL_DETAIL, compareAccessRoutes.manualDetail)
    router.post(comparePaths.COMPARE_MANUAL_DETAIL, compareAccessRoutes.submitManualDetail)
  }

  const thingsToDoInterceptRouter = () => {
    router.get('/calculation/:nomsId/things-to-do-before-calculation', thingsToDoInterceptRoutes.thingsToDoIntercept)
  }

  const genuineOverridesRoutes = () => {
    router.use('/', GenuineOverridesRoutes(calculateReleaseDatesService, prisonerService))
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
  thingsToDoInterceptRouter()
  genuineOverridesRoutes()
  return router
}

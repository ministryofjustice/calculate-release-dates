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

export default function Index({
  prisonerService,
  calculateReleaseDatesService,
  entryPointService,
  viewReleaseDatesService,
  userInputService,
  oneThousandCalculationsService,
  manualCalculationService,
  manualEntryService,
  bulkLoadService,
}: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))
  const calculationAccessRoutes = new CalculationRoutes(
    calculateReleaseDatesService,
    prisonerService,
    entryPointService,
    userInputService,
    viewReleaseDatesService
  )
  const checkInformationAccessRoutes = new CheckInformationRoutes(
    calculateReleaseDatesService,
    prisonerService,
    entryPointService,
    userInputService
  )
  const searchAccessRoutes = new SearchRoutes(prisonerService)

  const compareAccessRoutes = new CompareRoutes(
    oneThousandCalculationsService,
    calculateReleaseDatesService,
    bulkLoadService,
    prisonerService
  )

  const otherAccessRoutes = new OtherRoutes(
    oneThousandCalculationsService,
    calculateReleaseDatesService,
    prisonerService
  )
  const startRoutes = new StartRoutes(entryPointService, prisonerService, bulkLoadService)
  const viewAccessRoutes = new ViewRoutes(
    viewReleaseDatesService,
    calculateReleaseDatesService,
    prisonerService,
    entryPointService
  )

  const calculationQuestionRoutes = new CalculationQuestionRoutes(
    calculateReleaseDatesService,
    prisonerService,
    entryPointService,
    userInputService
  )

  const manualEntryAccessRoutes = new ManualEntryRoutes(
    calculateReleaseDatesService,
    prisonerService,
    manualCalculationService,
    manualEntryService
  )

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
      checkInformationAccessRoutes.submitUnsupportedCheckInformation
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

  const calculationRoutes = () => {
    get('/calculation/:nomsId/summary/:calculationRequestId', calculationAccessRoutes.calculationSummary)
    post('/calculation/:nomsId/summary/:calculationRequestId', calculationAccessRoutes.submitCalculationSummary)
    get('/calculation/:nomsId/summary/:calculationRequestId/print', calculationAccessRoutes.printCalculationSummary)
    get('/calculation/:nomsId/complete/:calculationRequestId', calculationAccessRoutes.complete)
  }

  const questionRoutes = () => {
    get('/calculation/:nomsId/alternative-release-arrangements', calculationQuestionRoutes.alternativeReleaseIntro)
    get('/calculation/:nomsId/select-offences-that-appear-in-list-a', calculationQuestionRoutes.selectOffencesInListA)
    get('/calculation/:nomsId/select-offences-that-appear-in-list-b', calculationQuestionRoutes.selectOffencesInListB)
    get('/calculation/:nomsId/select-offences-that-appear-in-list-c', calculationQuestionRoutes.selectOffencesInListC)
    get('/calculation/:nomsId/select-offences-that-appear-in-list-d', calculationQuestionRoutes.selectOffencesInListD)

    post('/calculation/:nomsId/select-offences-that-appear-in-list-a', calculationQuestionRoutes.submitOffencesInListA)
    post('/calculation/:nomsId/select-offences-that-appear-in-list-b', calculationQuestionRoutes.submitOffencesInListB)
    post('/calculation/:nomsId/select-offences-that-appear-in-list-c', calculationQuestionRoutes.submitOffencesInListC)
    post('/calculation/:nomsId/select-offences-that-appear-in-list-d', calculationQuestionRoutes.submitOffencesInListD)

    get('/schedule-15-list-a', calculationQuestionRoutes.offenceListA)
    get('/schedule-15-list-b', calculationQuestionRoutes.offenceListB)
    get('/schedule-15-list-c', calculationQuestionRoutes.offenceListC)
    get('/schedule-15-list-d', calculationQuestionRoutes.offenceListD)
  }

  const searchRoutes = () => {
    get('/search/prisoners', searchAccessRoutes.searchCalculatePrisoners)
    get('/view/search/prisoners', searchAccessRoutes.searchViewPrisoners)
  }

  const viewRoutes = () => {
    get('/view/:nomsId/latest', viewAccessRoutes.startViewJourney)
    get('/view/:nomsId/sentences-and-offences/:calculationRequestId', viewAccessRoutes.sentencesAndOffences)
    get('/view/:nomsId/calculation-summary/:calculationRequestId', viewAccessRoutes.calculationSummary)
    get('/view/:nomsId/calculation-summary/:calculationRequestId/print', viewAccessRoutes.printCalculationSummary)
  }

  const otherRoutes = () => {
    get('/prisoner/:nomsId/image', otherAccessRoutes.getPrisonerImage)
  }

  const compareRoutes = () => {
    get(comparePaths.COMPARE_INDEX, compareAccessRoutes.index)
    get(comparePaths.COMPARE_MANUAL, compareAccessRoutes.manualCalculation) // TODO remove this route as it was only for testing
    post(comparePaths.COMPARE_MANUAL, compareAccessRoutes.submitManualCalculation) // TODO remove this route as it was only for testing
    get(comparePaths.COMPARE_CHOOSE, compareAccessRoutes.choose)
  }

  indexRoutes()
  calculationRoutes()
  questionRoutes()
  checkInformationRoutes()
  manualEntryRoutes()
  searchRoutes()
  viewRoutes()
  otherRoutes()
  compareRoutes()

  return router
}

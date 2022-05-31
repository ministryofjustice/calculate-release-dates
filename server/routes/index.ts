import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { Services } from '../services'
import populateCurrentUser from '../middleware/populateCurrentUser'
import flashMessages from '../middleware/flashMessageMiddleware'
import tokenVerifier from '../api/tokenVerification'
import auth from '../authentication/auth'
import OtherRoutes from './otherRoutes'
import CalculationRoutes from './calculationRoutes'
import SearchRoutes from './searchRoutes'
import StartRoutes from './startRoutes'
import CheckInformationRoutes from './checkInformationRoutes'
import ViewRoutes from './viewRoutes'
import CalculationQuestionRoutes from './calculationQuestionRoutes'
import UserInputService from '../services/userInputService'

export default function Index({
  userService,
  prisonerService,
  calculateReleaseDatesService,
  entryPointService,
  viewReleaseDatesService,
  userInputService,
}: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))
  const calculationAccessRoutes = new CalculationRoutes(
    calculateReleaseDatesService,
    prisonerService,
    entryPointService
  )
  const checkInformationAccessRoutes = new CheckInformationRoutes(
    calculateReleaseDatesService,
    prisonerService,
    entryPointService,
    userInputService
  )
  const searchAccessRoutes = new SearchRoutes(prisonerService)
  const otherAccessRoutes = new OtherRoutes(calculateReleaseDatesService, prisonerService)
  const startRoutes = new StartRoutes(entryPointService, prisonerService)
  const viewAccessRoutes = new ViewRoutes(viewReleaseDatesService, calculateReleaseDatesService, prisonerService)

  const calculationQuestionRoutes = new CalculationQuestionRoutes(
    calculateReleaseDatesService,
    prisonerService,
    userInputService
  )

  const indexRoutes = () => {
    get('/', startRoutes.startPage)
    get('/supported-sentences', startRoutes.supportedSentences)
  }

  const checkInformationRoutes = () => {
    get('/calculation/:nomsId/check-information', checkInformationAccessRoutes.checkInformation)
    post('/calculation/:nomsId/check-information', checkInformationAccessRoutes.submitCheckInformation)
  }
  const calculationRoutes = () => {
    get('/calculation/:nomsId/summary/:calculationRequestId', calculationAccessRoutes.calculationSummary)
    post('/calculation/:nomsId/summary/:calculationRequestId', calculationAccessRoutes.submitCalculationSummary)
    get('/calculation/:nomsId/summary/:calculationRequestId/print', calculationAccessRoutes.printCalculationSummary)
    get('/calculation/:nomsId/complete/:calculationRequestId', calculationAccessRoutes.complete)
  }

  const questionRoutes = () => {
    get('/calculation/:nomsId/pre-calculation-questions', calculationQuestionRoutes.calculationQuestions)
    post('/calculation/:nomsId/pre-calculation-questions', calculationQuestionRoutes.submitUserInput)
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
    get('/test/calculation', otherAccessRoutes.testCalculation) // TODO remove this route as it was only for testing
    post('/test/calculation', otherAccessRoutes.submitTestCalculation) // TODO remove this route as it was only for testing
    get('/prisoner/:nomsId/image', otherAccessRoutes.getPrisonerImage)
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
  questionRoutes()
  checkInformationRoutes()
  searchRoutes()
  viewRoutes()
  otherRoutes()

  return router
}

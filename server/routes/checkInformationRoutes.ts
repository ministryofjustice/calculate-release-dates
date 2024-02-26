import { RequestHandler } from 'express'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import PrisonerService from '../services/prisonerService'
import EntryPointService from '../services/entryPointService'
import UserInputService from '../services/userInputService'
import config from '../config'
import CheckInformationService from '../services/checkInformationService'
import QuestionsService from '../services/questionsService'

export default class CheckInformationRoutes {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
    private readonly entryPointService: EntryPointService,
    private readonly userInputService: UserInputService,
    private readonly checkInformationService: CheckInformationService,
    private readonly questionsService: QuestionsService,
  ) {
    // intentionally left blank
  }

  public checkInformation: RequestHandler = async (req, res): Promise<void> => {
    const { token } = res.locals.user
    const { nomsId } = req.params
    if (config.featureToggles.manualEntry) {
      const unsupportedSentenceOrCalculationMessages =
        await this.calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages(nomsId, token)

      if (unsupportedSentenceOrCalculationMessages.length > 0) {
        return res.redirect(`/calculation/${nomsId}/check-information-unsupported`)
      }
    }

    const checkQuestions = await this.questionsService.checkQuestions(req, res)
    if (checkQuestions) {
      return res.redirect(`/calculation/${nomsId}/alternative-release-arrangements`)
    }
    const model = await this.checkInformationService.checkInformation(req, res, true)
    return res.render('pages/calculation/checkInformation', {
      model,
    })
  }

  public unsupportedCheckInformation: RequestHandler = async (req, res): Promise<void> => {
    const model = await this.checkInformationService.checkInformation(req, res, true, true)

    return res.render('pages/manualEntry/checkInformationUnsupported', {
      model,
    })
  }

  public submitUnsupportedCheckInformation: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const { token } = res.locals.user

    const manualEntryValidationMessages = await this.calculateReleaseDatesService.validateBookingForManualEntry(
      nomsId,
      token,
    )

    if (manualEntryValidationMessages.messages.length > 0) {
      return res.redirect(`/calculation/${nomsId}/check-information-unsupported?hasErrors=true`)
    }
    return res.redirect(`/calculation/${nomsId}/manual-entry`)
  }

  public submitCheckInformation: RequestHandler = async (req, res): Promise<void> => {
    const { username, token } = res.locals.user
    const { nomsId } = req.params

    const userInputs = this.userInputService.getCalculationUserInputForPrisoner(req, nomsId)
    userInputs.calculateErsed = req.body.ersed === 'true'
    this.userInputService.setCalculationUserInputForPrisoner(req, nomsId, userInputs)

    const errors = await this.calculateReleaseDatesService.validateBackend(nomsId, userInputs, token)
    if (errors.messages.length > 0) {
      return res.redirect(`/calculation/${nomsId}/check-information?hasErrors=true`)
    }

    const calculationRequestModel = await this.calculateReleaseDatesService.getCalculationRequestModel(
      req,
      userInputs,
      nomsId,
    )

    const releaseDates = await this.calculateReleaseDatesService.calculatePreliminaryReleaseDates(
      username,
      nomsId,
      calculationRequestModel,
      token,
    )
    return res.redirect(`/calculation/${nomsId}/summary/${releaseDates.calculationRequestId}`)
  }
}

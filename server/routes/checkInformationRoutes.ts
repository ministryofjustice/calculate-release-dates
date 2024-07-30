import { RequestHandler } from 'express'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import PrisonerService from '../services/prisonerService'
import UserInputService from '../services/userInputService'
import CheckInformationService from '../services/checkInformationService'
import CheckInformationViewModel from '../models/CheckInformationViewModel'
import ManualEntryCheckInformationUnsupportedViewModel from '../models/ManualEntryCheckInformationUnsupportedViewModel'
import { ErrorMessageType } from '../types/ErrorMessages'

export default class CheckInformationRoutes {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
    private readonly userInputService: UserInputService,
    private readonly checkInformationService: CheckInformationService,
  ) {
    // intentionally left blank
  }

  public checkInformation: RequestHandler = async (req, res): Promise<void> => {
    const { token } = res.locals.user
    const { nomsId } = req.params
    if (!this.userInputService.isCalculationReasonSet(req, nomsId)) {
      return res.redirect(`/calculation/${nomsId}/reason`)
    }
    const unsupportedSentenceOrCalculationMessages =
      await this.calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages(nomsId, token)

    if (unsupportedSentenceOrCalculationMessages.length > 0) {
      return res.redirect(`/calculation/${nomsId}/check-information-unsupported`)
    }

    const model = await this.checkInformationService.checkInformation(req, res, true)
    return res.render('pages/calculation/checkInformation', new CheckInformationViewModel(model, true))
  }

  public unsupportedCheckInformation: RequestHandler = async (req, res): Promise<void> => {
    const model = await this.checkInformationService.checkInformation(req, res, true, true)

    return res.render(
      'pages/manualEntry/checkInformationUnsupported',
      new ManualEntryCheckInformationUnsupportedViewModel(model),
    )
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
    const { token } = res.locals.user
    const { nomsId } = req.params

    const userInputs = this.userInputService.getCalculationUserInputForPrisoner(req, nomsId)
    userInputs.calculateErsed = req.body.ersed === 'true'
    this.userInputService.setCalculationUserInputForPrisoner(req, nomsId, userInputs)

    const errors = await this.calculateReleaseDatesService.validateBackend(nomsId, userInputs, token)
    if (errors.messages.length > 0) {
      if (errors.messageType === ErrorMessageType.UNSUPPORTED_SDS40_RECALL_SENTENCE_TYPE) {
        return res.redirect(`/calculation/${nomsId}/manual-entry`)
      }
      return res.redirect(`/calculation/${nomsId}/check-information?hasErrors=true`)
    }

    const calculationRequestModel = await this.calculateReleaseDatesService.getCalculationRequestModel(
      req,
      userInputs,
      nomsId,
    )

    const releaseDates = await this.calculateReleaseDatesService.calculatePreliminaryReleaseDates(
      nomsId,
      calculationRequestModel,
      token,
    )
    return res.redirect(`/calculation/${nomsId}/summary/${releaseDates.calculationRequestId}`)
  }
}

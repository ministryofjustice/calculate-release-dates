import { RequestHandler } from 'express'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import PrisonerService from '../services/prisonerService'
import UserInputService from '../services/userInputService'
import CheckInformationService from '../services/checkInformationService'
import CheckInformationViewModel from '../models/CheckInformationViewModel'
import ManualEntryCheckInformationUnsupportedViewModel from '../models/manual_calculation/ManualEntryCheckInformationUnsupportedViewModel'
import { ErrorMessageType } from '../types/ErrorMessages'
import { FullPageError, FullPageErrorType } from '../types/FullPageError'
import { isDataError } from '../sanitisedError'
import getMissingPrisonDataError from '../utils/errorUtils'

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
    const { caseloads, token, userRoles } = res.locals.user
    const { nomsId } = req.params

    await this.prisonerService.checkPrisonerAccess(nomsId, token, caseloads, userRoles)

    if (!this.userInputService.isCalculationReasonSet(req, nomsId)) {
      return res.redirect(`/calculation/${nomsId}/reason`)
    }

    try {
      const unsupportedMessages = await this.calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages(
        nomsId,
        token,
      )

      if (Array.isArray(unsupportedMessages) && unsupportedMessages.length > 0) {
        return res.redirect(`/calculation/${nomsId}/check-information-unsupported`)
      }
    } catch (error) {
      if (!isDataError(error)) throw error

      const dataError = getMissingPrisonDataError(error.data.userMessage)
      switch (dataError) {
        case FullPageErrorType.NO_OFFENCE_DATES:
          throw FullPageError.noOffenceDatesPage()
        case FullPageErrorType.NO_LICENCE_TERM_CODE:
          throw FullPageError.noLicenceTermPage()
        case FullPageErrorType.NO_IMPRISONMENT_TERM_CODE:
          throw FullPageError.noImprisonmentTermPage()
        default:
          throw error
      }
    }

    const model = await this.checkInformationService.checkInformation(req, res, true)
    return res.render('pages/calculation/checkInformation', new CheckInformationViewModel(model, true, req.originalUrl))
  }

  public unsupportedCheckInformation: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, userRoles } = res.locals.user
    const { nomsId } = req.params

    await this.prisonerService.checkPrisonerAccess(nomsId, token, caseloads, userRoles)

    const model = await this.checkInformationService.checkInformation(req, res, true, true)

    return res.render(
      'pages/manualEntry/checkInformationUnsupported',
      new ManualEntryCheckInformationUnsupportedViewModel(model, req.originalUrl),
    )
  }

  public submitUnsupportedCheckInformation: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, userRoles } = res.locals.user
    const { nomsId } = req.params

    await this.prisonerService.getPrisonerDetail(nomsId, token, caseloads, userRoles)

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
    const { caseloads, token, userRoles } = res.locals.user
    const { nomsId } = req.params

    await this.prisonerService.checkPrisonerAccess(nomsId, token, caseloads, userRoles)

    const userInputs = this.userInputService.getCalculationUserInputForPrisoner(req, nomsId)
    userInputs.calculateErsed = req?.body?.ersed === 'true'
    this.userInputService.setCalculationUserInputForPrisoner(req, nomsId, userInputs)

    const errors = await this.calculateReleaseDatesService.validateBackend(nomsId, userInputs, token)

    if (errors.messages.length > 0) {
      switch (errors.messageType) {
        case ErrorMessageType.MANUAL_ENTRY_JOURNEY_REQUIRED:
          if (req.session.manualEntryRoutingForBookings === undefined) {
            req.session.manualEntryRoutingForBookings = [nomsId]
          } else {
            req.session.manualEntryRoutingForBookings.push(nomsId)
          }
          return res.redirect(`/calculation/${nomsId}/manual-entry`)
        case ErrorMessageType.CONCURRENT_CONSECUTIVE:
          return res.redirect(
            `/calculation/${nomsId}/concurrent-consecutive?duration=${encodeURIComponent(errors.messages[0].text)}`,
          )
        default:
          return res.redirect(`/calculation/${nomsId}/check-information?hasErrors=true`)
      }
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

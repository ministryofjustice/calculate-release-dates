import { Request, Response } from 'express'
import { Controller } from '../controller'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import PrisonerService from '../../services/prisonerService'
import { FullPageError, FullPageErrorType } from '../../types/FullPageError'
import { CheckInformationForm } from './checkInformationSchema'
import { isDataError } from '../../sanitisedError'
import getMissingPrisonDataError from '../../utils/errorUtils'
import CheckInformationViewModel from '../../models/CheckInformationViewModel'
import CheckInformationService from '../../services/checkInformationService'
import UserInputService from '../../services/userInputService'
import { ErrorMessageType } from '../../types/ErrorMessages'

export default class CheckInformationController implements Controller {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
    private readonly checkInformationService: CheckInformationService,
    private readonly userInputService: UserInputService,
  ) {}

  GET = async (req: Request<{ nomsId: string; calculationRequestId: string }>, res: Response): Promise<void> => {
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

  POST = async (req: Request<{ nomsId: string }, unknown, CheckInformationForm>, res: Response): Promise<void> => {
    const { nomsId } = req.params
    const { ersed } = req.body
    const { caseloads, token, userRoles } = res.locals.user

    await this.prisonerService.checkPrisonerAccess(nomsId, token, caseloads, userRoles)

    const userInputs = this.userInputService.getCalculationUserInputForPrisoner(req, nomsId)
    userInputs.calculateErsed = ersed
    userInputs.usePreviouslyRecordedSLEDIfFound = true
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

    const calculationRequestModel = this.calculateReleaseDatesService.getCalculationRequestModel(
      req,
      userInputs,
      nomsId,
    )
    const releaseDates = await this.calculateReleaseDatesService.calculatePreliminaryReleaseDates(
      nomsId,
      calculationRequestModel,
      token,
    )
    if (releaseDates.usedPreviouslyRecordedSLED) {
      return res.redirect(
        `/calculation/${nomsId}/previously-recorded-sled-intercept/${releaseDates.calculationRequestId}`,
      )
    }
    return res.redirect(`/calculation/${nomsId}/summary/${releaseDates.calculationRequestId}`)
  }
}

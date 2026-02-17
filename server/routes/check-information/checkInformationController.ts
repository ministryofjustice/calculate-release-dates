import { Request, Response } from 'express'
import { Controller } from '../controller'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import PrisonerService from '../../services/prisonerService'
import { CheckInformationForm } from './checkInformationSchema'
import CheckInformationViewModel from '../../models/CheckInformationViewModel'
import CheckInformationService from '../../services/checkInformationService'
import UserInputService from '../../services/userInputService'

export default class CheckInformationController implements Controller {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
    private readonly checkInformationService: CheckInformationService,
    private readonly userInputService: UserInputService,
  ) {}

  GET = async (req: Request<{ nomsId: string; calculationRequestId: string }>, res: Response): Promise<void> => {
    const { caseloads, userRoles, username } = res.locals.user
    const { nomsId } = req.params

    if (!req.session.selectedApprovedDates) {
      req.session.selectedApprovedDates = {}
    }
    req.session.selectedApprovedDates[nomsId] = []

    await this.prisonerService.checkPrisonerAccess(nomsId, username, caseloads, userRoles)

    if (!this.userInputService.isCalculationReasonSet(req, nomsId)) {
      return res.redirect(`/calculation/${nomsId}/reason`)
    }
    const userInputs = this.userInputService.getCalculationUserInputForPrisoner(req, nomsId)
    const model = await this.checkInformationService.checkInformation(
      nomsId,
      userInputs,
      caseloads,
      userRoles,
      username,
    )
    return res.render('pages/calculation/checkInformation', new CheckInformationViewModel(model, true, req.originalUrl))
  }

  POST = async (req: Request<{ nomsId: string }, unknown, CheckInformationForm>, res: Response): Promise<void> => {
    const { nomsId } = req.params
    const { ersed } = req.body
    const { caseloads, userRoles, username } = res.locals.user

    await this.prisonerService.checkPrisonerAccess(nomsId, username, caseloads, userRoles)

    const userInputs = this.userInputService.getCalculationUserInputForPrisoner(req, nomsId)
    userInputs.calculateErsed = ersed
    userInputs.usePreviouslyRecordedSLEDIfFound = true
    this.userInputService.setCalculationUserInputForPrisoner(req, nomsId, userInputs)

    const errors = await this.calculateReleaseDatesService.validateBackend(nomsId, userInputs, username)

    if (errors.length > 0) {
      if (errors.find(e => e.calculationUnsupported)) {
        const validForManualEntry = await this.calculateReleaseDatesService.validateBookingForManualEntry(
          nomsId,
          username,
        )
        if (validForManualEntry.messages.length === 0) {
          if (req.session.manualEntryRoutingForBookings === undefined) {
            req.session.manualEntryRoutingForBookings = [nomsId]
          } else {
            req.session.manualEntryRoutingForBookings.push(nomsId)
          }
          return res.redirect(`/calculation/${nomsId}/manual-entry`)
        }
      } else if (errors.every(e => e.type === 'CONCURRENT_CONSECUTIVE')) {
        // this error is just a warning
        return res.redirect(
          `/calculation/${nomsId}/concurrent-consecutive?duration=${encodeURIComponent(errors[0].message)}`,
        )
      }
      return res.redirect(`/calculation/${nomsId}/check-information`)
    }

    const calculationRequestModel = this.calculateReleaseDatesService.getCalculationRequestModel(
      req,
      userInputs,
      nomsId,
    )
    const releaseDates = await this.calculateReleaseDatesService.calculatePreliminaryReleaseDates(
      nomsId,
      calculationRequestModel,
      username,
    )
    if (releaseDates.usedPreviouslyRecordedSLED) {
      return res.redirect(
        `/calculation/${nomsId}/previously-recorded-sled-intercept/${releaseDates.calculationRequestId}`,
      )
    }
    return res.redirect(`/calculation/${nomsId}/summary/${releaseDates.calculationRequestId}`)
  }
}

import { RequestHandler } from 'express'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import PrisonerService from '../services/prisonerService'
import UserInputService from '../services/userInputService'
import CheckInformationService from '../services/checkInformationService'
import ManualEntryCheckInformationUnsupportedViewModel from '../models/manual_calculation/ManualEntryCheckInformationUnsupportedViewModel'

export default class CheckInformationRoutes {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
    private readonly userInputService: UserInputService,
    private readonly checkInformationService: CheckInformationService,
  ) {
    // intentionally left blank
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
}

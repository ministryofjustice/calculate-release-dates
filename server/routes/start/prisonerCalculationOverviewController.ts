import { Request, Response } from 'express'
import { Controller } from '../controller'
import UserPermissionsService from '../../services/userPermissionsService'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import CourtCasesReleaseDatesService from '../../services/courtCasesReleaseDatesService'
import PrisonerCalculationOverviewViewModel from '../../models/PrisonerCalculationOverviewViewModel'

export default class PrisonerCalculationOverviewController implements Controller {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly userPermissionsService: UserPermissionsService,
    private readonly courtCasesReleaseDatesService: CourtCasesReleaseDatesService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { token, username, userRoles } = res.locals.user
    const { nomsId } = req.params

    const prisonerDetail = req.prisoner
    const prisonerCalculationOverview = await this.calculateReleaseDatesService.getPrisonCalculationOverview(
      nomsId,
      username,
    )
    const serviceDefinitions = await this.courtCasesReleaseDatesService.getServiceDefinitions(nomsId, token)
    const allowBulkLoad = this.userPermissionsService.allowBulkLoad(userRoles)

    return res.render(
      'pages/prisonerCalculationOverview',
      new PrisonerCalculationOverviewViewModel(
        prisonerCalculationOverview,
        serviceDefinitions,
        allowBulkLoad,
        prisonerDetail,
      ),
    )
  }
}

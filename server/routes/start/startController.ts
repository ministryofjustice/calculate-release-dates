import { Request, Response } from 'express'
import { Controller } from '../controller'
import PrisonerService from '../../services/prisonerService'
import UserPermissionsService from '../../services/userPermissionsService'
import { indexViewModelForPrisoner } from '../../models/IndexViewModel'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import CourtCasesReleaseDatesService from '../../services/courtCasesReleaseDatesService'
import config from '../../config'

export default class StartController implements Controller {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
    private readonly userPermissionsService: UserPermissionsService,
    private readonly courtCasesReleaseDatesService: CourtCasesReleaseDatesService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { prisonId } = req.query as Record<string, string>

    if (prisonId) {
      const allowBulkLoad = this.userPermissionsService.allowBulkLoad(res.locals.user.userRoles)
      const { caseloads, token, userRoles, username } = res.locals.user
      const prisonerDetail = await this.prisonerService.getPrisonerDetail(prisonId, username, caseloads, userRoles)
      const calculationHistory = await this.calculateReleaseDatesService.getCalculationHistory(prisonId, username)
      const hasIndeterminateSentence = await this.calculateReleaseDatesService.hasIndeterminateSentences(
        prisonerDetail.bookingId,
        username,
      )

      const latestCalculationCardOrError = await this.calculateReleaseDatesService.getLatestCalculationCardForPrisoner(
        prisonId,
        username,
        hasIndeterminateSentence,
      )

      const serviceDefinitions = await this.courtCasesReleaseDatesService.getServiceDefinitions(prisonId, token)

      const { latestCalcCard, latestCalcCardAction, calculation } = latestCalculationCardOrError
      return res.render(
        'pages/ccardIndex',
        indexViewModelForPrisoner(
          prisonerDetail,
          calculationHistory,
          prisonId,
          allowBulkLoad,
          latestCalcCard,
          latestCalcCardAction,
          !hasIndeterminateSentence,
          serviceDefinitions,
          calculation,
        ),
      )
    }

    return res.redirect(config.apis.digitalPrisonServices.ui_url)
  }
}

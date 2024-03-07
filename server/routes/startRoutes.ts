import { RequestHandler } from 'express'
import EntryPointService from '../services/entryPointService'
import PrisonerService from '../services/prisonerService'
import UserPermissionsService from '../services/userPermissionsService'
import config from '../config'
import { indexViewModelForPrisoner, indexViewModelWithNoPrisoner } from '../models/IndexViewModel'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'

export default class StartRoutes {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly entryPointService: EntryPointService,
    private readonly prisonerService: PrisonerService,
    private readonly userPermissionsService: UserPermissionsService,
  ) {
    // intentionally left blank
  }

  public startPage: RequestHandler = async (req, res): Promise<void> => {
    const { prisonId } = req.query as Record<string, string>
    if (prisonId) {
      this.entryPointService.setDpsEntrypointCookie(res, prisonId)
      const { username, caseloads, token } = res.locals.user
      const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, prisonId, caseloads, token)
      const calculationHistory = await this.calculateReleaseDatesService.getCalculationHistory(prisonId, token)
      const template = config.featureToggles.useCCARDLayout ? 'pages/ccardIndex' : 'pages/index'
      return res.render(
        template,
        indexViewModelForPrisoner(
          prisonerDetail,
          calculationHistory,
          prisonId,
          config.featureToggles.calculationReasonToggle,
        ),
      )
    }
    const allowBulkLoad = this.userPermissionsService.allowBulkLoad(res.locals.user.userRoles)
    this.entryPointService.setStandaloneEntrypointCookie(res)
    return res.render('pages/index', indexViewModelWithNoPrisoner(allowBulkLoad, prisonId))
  }

  public supportedSentences: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    let prisonId: string
    if (this.entryPointService.isDpsEntryPoint(req)) {
      prisonId = this.entryPointService.getDpsPrisonerId(req)
    }
    return res.render('pages/supportedSentences', { prisonId, nomsId })
  }

  public accessibility: RequestHandler = async (req, res): Promise<void> => {
    return res.render('pages/accessibility')
  }
}

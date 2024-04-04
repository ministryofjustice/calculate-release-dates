import { RequestHandler } from 'express'
import PrisonerService from '../services/prisonerService'
import UserPermissionsService from '../services/userPermissionsService'
import config from '../config'
import { indexViewModelForPrisoner, indexViewModelWithNoPrisoner } from '../models/IndexViewModel'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'

export default class StartRoutes {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
    private readonly userPermissionsService: UserPermissionsService,
  ) {
    // intentionally left blank
  }

  public startPage: RequestHandler = async (req, res): Promise<void> => {
    const { prisonId } = req.query as Record<string, string>
    const allowBulkLoad = this.userPermissionsService.allowBulkLoad(res.locals.user.userRoles)
    if (prisonId) {
      const { caseloads, token } = res.locals.user
      const prisonerDetail = await this.prisonerService.getPrisonerDetail(prisonId, caseloads, token)
      const calculationHistory = await this.calculateReleaseDatesService.getCalculationHistory(prisonId, token)
      const { latestCalcCard, latestCalcCardAction } = config.featureToggles.useCCARDLayout
        ? await this.calculateReleaseDatesService.getLatestCalculationCardForPrisoner(prisonId, token)
        : { latestCalcCard: undefined, latestCalcCardAction: undefined }
      const template = config.featureToggles.useCCARDLayout ? 'pages/ccardIndex' : 'pages/index'

      return res.render(
        template,
        indexViewModelForPrisoner(
          prisonerDetail,
          calculationHistory,
          prisonId,
          allowBulkLoad,
          latestCalcCard,
          latestCalcCardAction,
        ),
      )
    }
    if (config.featureToggles.useCCARDLayout) {
      return res.redirect('/search/prisoners')
    }
    return res.render('pages/index', indexViewModelWithNoPrisoner(allowBulkLoad, prisonId))
  }

  public supportedSentences: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    return res.render('pages/supportedSentences', { nomsId })
  }

  public accessibility: RequestHandler = async (req, res): Promise<void> => {
    return res.render('pages/accessibility')
  }
}

import { RequestHandler } from 'express'
import PrisonerService from '../services/prisonerService'
import UserPermissionsService from '../services/userPermissionsService'
import { indexViewModelForPrisoner } from '../models/IndexViewModel'
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
      const hasIndeterminateSentence = await this.calculateReleaseDatesService.hasIndeterminateSentences(
        prisonerDetail.bookingId,
        token,
      )
      const { latestCalcCard, latestCalcCardAction } =
        await this.calculateReleaseDatesService.getLatestCalculationCardForPrisoner(
          prisonId,
          token,
          hasIndeterminateSentence,
        )
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
        ),
      )
    }
    return res.redirect('/search/prisoners')
  }

  public supportedSentences: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    return res.render('pages/supportedSentences', { nomsId })
  }

  public accessibility: RequestHandler = async (req, res): Promise<void> => {
    return res.render('pages/accessibility')
  }
}

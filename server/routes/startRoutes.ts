import { RequestHandler } from 'express'
import PrisonerService from '../services/prisonerService'
import UserPermissionsService from '../services/userPermissionsService'
import { indexViewModelForPrisoner } from '../models/IndexViewModel'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import CourtCasesReleaseDatesService from '../services/courtCasesReleaseDatesService'
import config from '../config'
import { indexErrorViewModelForPrisoner } from '../models/IndexErrorViewModel'
import { FullPageError } from '../types/FullPageError'

export default class StartRoutes {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
    private readonly userPermissionsService: UserPermissionsService,
    private readonly courtCasesReleaseDatesService: CourtCasesReleaseDatesService,
  ) {
    // intentionally left blank
  }

  public startPage: RequestHandler = async (req, res): Promise<void> => {
    const { prisonId } = req.query as Record<string, string>
    const allowBulkLoad = this.userPermissionsService.allowBulkLoad(res.locals.user.userRoles)
    if (prisonId) {
      const { caseloads, token, userRoles } = res.locals.user
      const prisonerDetail = await this.prisonerService.getPrisonerDetail(prisonId, caseloads, userRoles)
      const calculationHistory = await this.calculateReleaseDatesService.getCalculationHistory(prisonId, token)
      const hasIndeterminateSentence = await this.calculateReleaseDatesService.hasIndeterminateSentences(
        prisonerDetail.bookingId,
        token,
      )

      const latestCalculationCardOrError = await this.calculateReleaseDatesService.getLatestCalculationCardForPrisoner(
        prisonId,
        token,
        hasIndeterminateSentence,
      )

      const serviceDefinitions = await this.courtCasesReleaseDatesService.getServiceDefinitions(prisonId, token)

      if (latestCalculationCardOrError instanceof FullPageError) {
        return res.render(
          'pages/ccardIndexError',
          indexErrorViewModelForPrisoner(
            latestCalculationCardOrError,
            prisonerDetail,
            calculationHistory,
            prisonId,
            allowBulkLoad,
            serviceDefinitions,
          ),
        )
      }

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

    return res.redirect('/search/prisoners')
  }

  public supportedSentences: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    return res.render('pages/supportedSentences', { nomsId })
  }

  public accessibility: RequestHandler = async (req, res): Promise<void> => {
    const ccardAccessibility = `${config.apis.courtCasesAndReleaseDatesUi.url}/accessibility`
    return res.redirect(ccardAccessibility)
  }
}

import { Request, Response } from 'express'
import { Controller } from '../controller'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import PrisonerService from '../../services/prisonerService'
import CalculationSecondCheckSummaryPageViewModel from '../../models/calculation/CalculationSummarySecondCheckViewModel'
import UserInputService from '../../services/userInputService'

export default class CalculationSecondCheckSummaryController implements Controller {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
    private readonly userInputService: UserInputService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { caseloads, userRoles, username } = res.locals.user
    const { nomsId } = req.params
    await this.prisonerService.checkPrisonerAccess(nomsId, username, caseloads, userRoles)
    const prisonerDetail = req.prisoner

    const hasIndeterminateSentence = await this.calculateReleaseDatesService.hasIndeterminateSentences(
      prisonerDetail.bookingId,
      username,
    )

    const latestCalculationCardOrError = await this.calculateReleaseDatesService.getLatestCalculationCardForPrisoner(
      nomsId,
      username,
      hasIndeterminateSentence,
    )
    const { latestCalcCard, calculation } = latestCalculationCardOrError

    if (!calculation?.calculationRequestId) {
      return res.redirect(`/?prisonId=${nomsId}`)
    }

    this.setLatestCalculationRequestId(req, nomsId, calculation.calculationRequestId)
    return res.render(
      'pages/calculation/secondCheckCalculationSummary',
      new CalculationSecondCheckSummaryPageViewModel(
        prisonerDetail,
        calculation.calculationType,
        latestCalcCard,
        `/?prisonId=${nomsId}`,
        `/calculation/${nomsId}/check-information`,
      ),
    )
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { nomsId } = req.params
    const { username, token } = res.locals.user
    const calculationRequestId = this.userInputService.getLatestCalculationRequestId(req, nomsId)

    if (!calculationRequestId) {
      return res.redirect(`/calculation/${nomsId}/check-information`)
    }

    await this.calculateReleaseDatesService.confirmSecondCheck(calculationRequestId, username, nomsId, token)

    return res.redirect(`/calculation/${nomsId}/complete/${calculationRequestId}`)
  }

  private setLatestCalculationRequestId(req: Request, nomsId: string, latestCalculationRequestId: number) {
    if (req.session.latestCalculationRequestId == null) {
      req.session.latestCalculationRequestId = {}
    }

    req.session.latestCalculationRequestId[nomsId] = latestCalculationRequestId
  }
}

import { Request, Response } from 'express'
import { Controller } from '../controller'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import PrisonerService from '../../services/prisonerService'
import { CalculationSummaryForm } from './calculationSummarySchema'
import saveCalculation from '../saveCalculationHelper'
import CalculationSecondCheckSummaryPageViewModel from '../../models/calculation/CalculationSummarySecondCheckViewModel'

export default class CalculationSecondCheckSummaryController implements Controller {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
  ) {}

  GET = async (req: Request<{ nomsId: string; calculationRequestId: string }>, res: Response): Promise<void> => {
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

  POST = async (
    req: Request<{ nomsId: string; calculationRequestId: string }, unknown, CalculationSummaryForm>,
    res: Response,
  ): Promise<void> => {
    const { nomsId } = req.params
    const calculationRequestId = Number(req.params.calculationRequestId)

    await saveCalculation(
      req,
      res,
      this.calculateReleaseDatesService,
      `/calculation/${nomsId}/secondCheckSummary/${calculationRequestId}`,
    )
  }
}

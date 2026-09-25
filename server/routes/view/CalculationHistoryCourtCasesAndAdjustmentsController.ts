import { Request, Response } from 'express'
import { Controller } from '../controller'
import PrisonerService from '../../services/prisonerService'
import ViewReleaseDatesService from '../../services/viewReleaseDatesService'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import SentenceTypes from '../../models/SentenceTypes'
import { PrisonApiOffenderSentenceAndOffences } from '../../@types/prisonApi/prisonClientTypes'
import CalculationHistoryCourtCasesAndAdjustmentsViewModel from '../../models/CalculationHistoryCourtCasesAndAdjustmentsViewModel'

export default class CalculationHistoryCourtCasesAndAdjustmentsController implements Controller {
  constructor(
    private readonly viewReleaseDatesService: ViewReleaseDatesService,
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
  ) {}

  GET = async (
    req: Request<{ nomsId: string; source: string; id: string }, unknown, unknown, { returnToPage: string }>,
    res: Response,
  ): Promise<void> => {
    const { caseloads, userRoles, username } = res.locals.user
    const { nomsId, id } = req.params
    const { returnToPage } = req.query
    const calculationRequestId = Number(id)
    const prisonerDetail = req.prisoner

    await this.prisonerService.checkPrisonerAccess(nomsId, username, caseloads, userRoles)

    const detailedCalculationResults = await this.calculateReleaseDatesService.getDetailedCalculationResults(
      calculationRequestId,
      username,
    )
    const { sentencesAndOffences, adjustments } = detailedCalculationResults.calculationOriginalData

    const returnToCustody = (sentencesAndOffences as PrisonApiOffenderSentenceAndOffences[]).filter(s =>
      SentenceTypes.isSentenceFixedTermRecall(s),
    ).length
      ? await this.viewReleaseDatesService.getReturnToCustodyDate(calculationRequestId, username)
      : null

    res.render(
      'pages/view/calculationHistoryCourtCasesAndAdjustments',
      new CalculationHistoryCourtCasesAndAdjustmentsViewModel(
        prisonerDetail,
        sentencesAndOffences,
        returnToCustody,
        detailedCalculationResults.context.calculationReason
          ? detailedCalculationResults.context.calculationReason.displayName
          : 'Not entered',
        detailedCalculationResults.context.calculationDate,
        adjustments,
        detailedCalculationResults.context.calculatedByDisplayName,
        detailedCalculationResults.context.calculatedAtPrisonDescription,
        calculationRequestId,
        Number(returnToPage),
      ),
    )
  }
}

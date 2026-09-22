import { Request, Response } from 'express'
import { Controller } from '../controller'
import PrisonerService from '../../services/prisonerService'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import CalculationHistoryOverviewViewModel from '../../models/CalculationHistoryOverviewViewModel'
import { PrisonApiPrisoner } from '../../@types/prisonApi/prisonClientTypes'
import {
  DetailedCalculationResults,
  HistoricCalculationSummaryPage,
  NomisCalculationSummary,
} from '../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import config from '../../config'
import { calculationSummaryDatesPanelModelFromCalculationSummaryViewModel } from '../../views/pages/components/calculation-summary-dates-card/CalculationSummaryDatesCardModel'

export default class CalculationHistoryOverviewController implements Controller {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
  ) {}

  GET = async (req: Request<{ nomsId: string; source: string; id: string }>, res: Response): Promise<void> => {
    const { nomsId, source, id } = req.params
    const { page } = req.query
    const { caseloads, userRoles, username } = res.locals.user
    const prisonerDetail = req.prisoner

    await this.prisonerService.checkPrisonerAccess(nomsId, username, caseloads, userRoles)
    const history = await this.calculateReleaseDatesService.getCalculationHistoryPage(
      nomsId,
      Number(page ?? '1'),
      config.calculationHistory.pageSize,
      username,
    )

    let model: CalculationHistoryOverviewViewModel
    if (source === 'CRDS') {
      model = await this.calculateReleaseDatesService
        .getDetailedCalculationResults(Number(id), username)
        .then(detailedResults =>
          this.createModelFromDetailedCalculationResults(prisonerDetail, detailedResults, history, source, id),
        )
    } else if (source === 'NOMIS') {
      model = await this.calculateReleaseDatesService
        .getNomisCalculationSummary(Number(id), username)
        .then(nomisCalculationSummary =>
          this.createModelFromNomisCalculationSummary(prisonerDetail, nomisCalculationSummary, history, source, id),
        )
    } else {
      throw Error(`Unknown source for historic calculation ${source}`)
    }

    res.render('pages/view/calculationHistoryOverview', model)
  }

  private createModelFromDetailedCalculationResults(
    prisonerDetail: PrisonApiPrisoner,
    detailedResults: DetailedCalculationResults,
    history: HistoricCalculationSummaryPage,
    source: string,
    id: string,
  ): CalculationHistoryOverviewViewModel {
    const courtCaseCount = new Set(
      (detailedResults.calculationOriginalData.sentencesAndOffences ?? [])
        .filter(it => it.caseSequence != null)
        .map(it => it.caseSequence),
    ).size
    const sentenceCount = (detailedResults.calculationOriginalData.sentencesAndOffences ?? []).length
    const adjustmentTypes: string[] = [
      ...new Set(
        (detailedResults.calculationOriginalData.adjustments ?? [])
          .filter(it => it.adjustmentType !== 'UNUSED_DEDUCTIONS')
          .map(it => it.adjustmentType),
      ),
    ]
    return new CalculationHistoryOverviewViewModel(
      prisonerDetail,
      source,
      Number(id),
      detailedResults.context.calculationDate,
      detailedResults.context.calculationReason ? detailedResults.context.calculationReason.displayName : 'Not entered',
      detailedResults.context.otherReasonDescription,
      detailedResults.context.calculatedByDisplayName,
      detailedResults.context.calculatedAtPrisonDescription,
      detailedResults.context.calculationType,
      detailedResults.secondCheckDetails,
      history,
      config.calculationHistory.pageSize,
      calculationSummaryDatesPanelModelFromCalculationSummaryViewModel(detailedResults),
      courtCaseCount,
      sentenceCount,
      adjustmentTypes,
    )
  }

  private createModelFromNomisCalculationSummary(
    prisonerDetail: PrisonApiPrisoner,
    nomisCalculationSummary: NomisCalculationSummary,
    history: HistoricCalculationSummaryPage,
    source: string,
    id: string,
  ): CalculationHistoryOverviewViewModel {
    return new CalculationHistoryOverviewViewModel(
      prisonerDetail,
      source,
      Number(id),
      nomisCalculationSummary.calculatedAt,
      nomisCalculationSummary.reason ?? 'Not entered',
      null,
      nomisCalculationSummary.calculatedByDisplayName,
      null,
      null,
      null,
      history,
      config.calculationHistory.pageSize,
      calculationSummaryDatesPanelModelFromCalculationSummaryViewModel(nomisCalculationSummary),
      null,
      null,
      [],
    )
  }
}

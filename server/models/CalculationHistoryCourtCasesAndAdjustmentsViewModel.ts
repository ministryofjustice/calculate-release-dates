import {
  AdjustmentDto,
  AnalysedAdjustment,
  AnalysedSentenceAndOffence,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import {
  PrisonApiOffenderSentenceAndOffences,
  PrisonApiPrisoner,
  PrisonApiReturnToCustodyDate,
} from '../@types/prisonApi/prisonClientTypes'
import { groupBy, indexBy } from '../utils/utils'
import ViewRouteCourtCaseTableViewModel from './ViewRouteCourtCaseTableViewModel'
import AdjustmentTablesModel, {
  adjustmentsTablesFromAdjustmentDTOs,
} from '../views/pages/components/adjustments-tables/AdjustmentTablesModel'
import PrisonerContextViewModel from './PrisonerContextViewModel'
import SentenceHelper from './SentenceHelper'

export default class CalculationHistoryCourtCasesAndAdjustmentsViewModel extends PrisonerContextViewModel {
  public cases: ViewRouteCourtCaseTableViewModel[]

  public sentenceSequenceToSentence: Map<number, PrisonApiOffenderSentenceAndOffences>

  public offenceCount: number

  public returnToCustodyDate?: string

  public adjustmentsTablesModel: AdjustmentTablesModel

  public sentenceHelper: SentenceHelper

  public constructor(
    public prisonerDetail: PrisonApiPrisoner,
    public sentencesAndOffences: AnalysedSentenceAndOffence[],
    returnToCustodyDate: PrisonApiReturnToCustodyDate | null,
    public calculationReasonDescription: string,
    public calculationDate: string,
    adjustmentsDtos: AnalysedAdjustment[] | AdjustmentDto[],
    public calculatedByDisplayName: string | null,
    public calculatedAtPrisonDescription: string | null,
    public calculationRequestId: number,
    public returnToPage: number,
  ) {
    super(prisonerDetail)
    this.cases = Array.from(
      groupBy(sentencesAndOffences, (sent: PrisonApiOffenderSentenceAndOffences) => sent.caseSequence).values(),
    )
      .map(sentences => new ViewRouteCourtCaseTableViewModel(sentences))
      .sort((a, b) => a.caseSequence - b.caseSequence)
    this.sentenceSequenceToSentence = indexBy(
      sentencesAndOffences,
      (sent: PrisonApiOffenderSentenceAndOffences) => sent.sentenceSequence,
    )
    this.offenceCount = sentencesAndOffences.length
    this.returnToCustodyDate = returnToCustodyDate?.returnToCustodyDate
    this.adjustmentsTablesModel = adjustmentsTablesFromAdjustmentDTOs(adjustmentsDtos ?? [], sentencesAndOffences)
    this.sentenceHelper = new SentenceHelper(sentencesAndOffences)
  }
}

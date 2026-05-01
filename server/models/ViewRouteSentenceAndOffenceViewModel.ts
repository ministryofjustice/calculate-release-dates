import {
  AdjustmentDto,
  AnalysedAdjustment,
  AnalysedSentenceAndOffence,
  CalculationReason,
  CalculationSentenceUserInput,
  CalculationUserInputs,
  OffenderOffence,
  SentenceAndOffenceWithReleaseArrangements,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import {
  PrisonApiOffenderSentenceAndOffences,
  PrisonApiPrisoner,
  PrisonApiReturnToCustodyDate,
} from '../@types/prisonApi/prisonClientTypes'
import { ErrorMessages } from '../types/ErrorMessages'
import { groupBy, indexBy } from '../utils/utils'
import SentenceTypes from './SentenceTypes'
import ViewRouteCourtCaseTableViewModel from './ViewRouteCourtCaseTableViewModel'
import AdjustmentTablesModel, {
  adjustmentsTablesFromAdjustmentDTOs,
} from '../views/pages/components/adjustments-tables/AdjustmentTablesModel'

export default class ViewRouteSentenceAndOffenceViewModel {
  public cases: ViewRouteCourtCaseTableViewModel[]

  public sentenceSequenceToSentence: Map<number, PrisonApiOffenderSentenceAndOffences>

  public offenceCount: number

  public returnToCustodyDate?: string

  public sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[]

  public adjustmentsTablesModel: AdjustmentTablesModel

  public constructor(
    public prisonerDetail: PrisonApiPrisoner,
    public userInputs: CalculationUserInputs,
    sentencesAndOffences: SentenceAndOffenceWithReleaseArrangements[],
    public calculationType: string,
    returnToCustodyDate?: PrisonApiReturnToCustodyDate,
    public validationErrors?: ErrorMessages,
    public calculationReason?: CalculationReason,
    public otherReasonDescription?: string,
    public calculationDate?: string,
    adjustmentsDtos?: AnalysedAdjustment[] | AdjustmentDto[],
    public genuineOverrideReasonDescription?: string,
    public calculatedByDisplayName?: string,
    public calculatedAtPrisonDescription?: string,
  ) {
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
    this.sentencesAndOffences = sentencesAndOffences
    this.adjustmentsTablesModel = adjustmentsTablesFromAdjustmentDTOs(adjustmentsDtos ?? [], sentencesAndOffences)
  }

  public rowIsSdsPlus(sentence: AnalysedSentenceAndOffence, offence: OffenderOffence): boolean {
    const oldUserInputForSDSPlus =
      this.userInputs &&
      this.userInputs.sentenceCalculationUserInputs.find((it: CalculationSentenceUserInput) => {
        return it.offenceCode === offence.offenceCode && it.sentenceSequence === sentence.sentenceSequence
      })
    const isUserIdentifiedSDSPlus = oldUserInputForSDSPlus && oldUserInputForSDSPlus.userChoice
    return isUserIdentifiedSDSPlus || sentence.isSDSPlus
  }

  public isErsedChecked(): boolean {
    return this.userInputs?.calculateErsed === true
  }

  public isRecallOnly(): boolean {
    return this.sentencesAndOffences.every(sentence => SentenceTypes.isRecall(sentence))
  }

  public hasMultipleOffencesToASentence(): boolean {
    return this.getMultipleOffencesToASentence().length > 0
  }

  public getMultipleOffencesToASentence(): number[][] {
    const caseAndLIneSequences: { caseSequence: number; lineSequence: number }[] = this.sentencesAndOffences.map(
      sentence => {
        return { caseSequence: sentence.caseSequence, lineSequence: sentence.lineSequence }
      },
    )
    const elementTracker: Record<string, boolean> = {}
    const duplicates: Record<string, { caseSequence: number; lineSequence: number }> = {}

    caseAndLIneSequences.forEach(item => {
      const key = `${item.caseSequence}-${item.lineSequence}`
      if (elementTracker[key]) {
        duplicates[key] = item
      } else {
        elementTracker[key] = true
      }
    })
    return Object.keys(duplicates).map(key => [duplicates[key].caseSequence, duplicates[key].lineSequence])
  }
}

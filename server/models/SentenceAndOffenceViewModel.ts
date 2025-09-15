import {
  AdjustmentDto,
  AnalysedAdjustment,
  AnalysedSentenceAndOffence,
  CalculationUserInputs,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import {
  AnalysedPrisonApiBookingAndSentenceAdjustments,
  PrisonApiPrisoner,
  PrisonApiReturnToCustodyDate,
} from '../@types/prisonApi/prisonClientTypes'
import { ErrorMessages } from '../types/ErrorMessages'
import { groupBy, indexBy } from '../utils/utils'
import AdjustmentsViewModel from './AdjustmentsViewModel'
import CourtCaseTableViewModel from './CourtCaseTableViewModel'
import SentenceTypes from './SentenceTypes'
import AdjustmentTablesModel, {
  adjustmentsTablesFromAdjustmentDTOs,
} from '../views/pages/components/adjustments-tables/AdjustmentTablesModel'

export default class SentenceAndOffenceViewModel {
  public adjustments: AdjustmentsViewModel

  public cases: CourtCaseTableViewModel[]

  public sentenceSequenceToSentence: Map<number, AnalysedSentenceAndOffence>

  public offenceCount: number

  public returnToCustodyDate?: string

  public sentencesAndOffences: AnalysedSentenceAndOffence[]

  public displaySDSPlusBanner: boolean

  public adjustmentsTablesModel: AdjustmentTablesModel

  public constructor(
    public prisonerDetail: PrisonApiPrisoner,
    public userInputs: CalculationUserInputs,
    sentencesAndOffences: AnalysedSentenceAndOffence[],
    adjustments: AnalysedPrisonApiBookingAndSentenceAdjustments,
    public viewJourney: boolean,
    public ersedEligible: boolean,
    returnToCustodyDate?: PrisonApiReturnToCustodyDate,
    public validationErrors?: ErrorMessages,
    adjustmentsDtos?: AnalysedAdjustment[] | AdjustmentDto[],
  ) {
    this.adjustments = new AdjustmentsViewModel(adjustments, sentencesAndOffences)
    this.cases = Array.from(
      groupBy(sentencesAndOffences, (sent: AnalysedSentenceAndOffence) => sent.caseSequence).values(),
    )
      .map(sentences => new CourtCaseTableViewModel(sentences))
      .sort((a, b) => a.caseSequence - b.caseSequence)
    this.sentenceSequenceToSentence = indexBy(
      sentencesAndOffences,
      (sent: AnalysedSentenceAndOffence) => sent.sentenceSequence,
    )
    this.offenceCount = sentencesAndOffences.length
    this.returnToCustodyDate = returnToCustodyDate?.returnToCustodyDate
    this.sentencesAndOffences = sentencesAndOffences
    this.displaySDSPlusBanner = sentencesAndOffences.some(sentence => sentence.isSDSPlus === true)
    this.adjustmentsTablesModel = adjustmentsTablesFromAdjustmentDTOs(adjustmentsDtos ?? [], sentencesAndOffences)
  }

  public rowIsSdsPlus(sentence: AnalysedSentenceAndOffence): boolean {
    return sentence.isSDSPlus === true
  }

  public isErsedChecked(): boolean {
    return this.userInputs?.calculateErsed === true
  }

  public isErsedEligible(): boolean {
    return this.ersedEligible
  }

  public isRecallOnly(): boolean {
    return this.sentencesAndOffences.every(sentence => SentenceTypes.isRecall(sentence))
  }

  public hasMultipleOffencesToASentence(): boolean {
    return this.getMultipleOffencesToASentence().length > 0
  }

  public getMultipleOffencesToASentence(): number[][] {
    const array = this.sentencesAndOffences.map(sentence => {
      return { caseSequence: sentence.caseSequence, lineSequence: sentence.lineSequence }
    })
    const elementTracker = {}
    const duplicates = {}

    array.forEach(item => {
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

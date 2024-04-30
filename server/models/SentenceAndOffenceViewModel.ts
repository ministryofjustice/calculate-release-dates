import {
  AnalyzedSentenceAndOffence,
  CalculationUserInputs,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import {
  AnalyzedPrisonApiBookingAndSentenceAdjustments,
  PrisonApiPrisoner,
  PrisonApiReturnToCustodyDate,
} from '../@types/prisonApi/prisonClientTypes'
import { ErrorMessages } from '../types/ErrorMessages'
import { groupBy, indexBy } from '../utils/utils'
import AdjustmentsViewModel from './AdjustmentsViewModel'
import CourtCaseTableViewModel from './CourtCaseTableViewModel'
import SentenceTypes from './SentenceTypes'

export default class SentenceAndOffenceViewModel {
  public adjustments: AdjustmentsViewModel

  public cases: CourtCaseTableViewModel[]

  public sentenceSequenceToSentence: Map<number, AnalyzedSentenceAndOffence>

  public offenceCount: number

  public returnToCustodyDate?: string

  public sentencesAndOffences: AnalyzedSentenceAndOffence[]

  public displaySDSPlusBanner: boolean

  public constructor(
    public prisonerDetail: PrisonApiPrisoner,
    public userInputs: CalculationUserInputs,
    sentencesAndOffences: AnalyzedSentenceAndOffence[],
    adjustments: AnalyzedPrisonApiBookingAndSentenceAdjustments,
    public viewJourney: boolean,
    returnToCustodyDate?: PrisonApiReturnToCustodyDate,
    public validationErrors?: ErrorMessages,
  ) {
    this.adjustments = new AdjustmentsViewModel(adjustments, sentencesAndOffences)
    this.cases = Array.from(
      groupBy(sentencesAndOffences, (sent: AnalyzedSentenceAndOffence) => sent.caseSequence).values(),
    )
      .map(sentences => new CourtCaseTableViewModel(sentences))
      .sort((a, b) => a.caseSequence - b.caseSequence)
    this.sentenceSequenceToSentence = indexBy(
      sentencesAndOffences,
      (sent: AnalyzedSentenceAndOffence) => sent.sentenceSequence,
    )
    this.offenceCount = sentencesAndOffences.length
    this.returnToCustodyDate = returnToCustodyDate?.returnToCustodyDate
    this.sentencesAndOffences = sentencesAndOffences
    this.displaySDSPlusBanner = sentencesAndOffences.some(sentence => sentence.isSDSPlus === true)
  }

  public rowIsSdsPlus(sentence: AnalyzedSentenceAndOffence): boolean {
    return sentence.isSDSPlus === true
  }

  public isErsedChecked(): boolean {
    return this.userInputs?.calculateErsed === true
  }

  public isErsedElligible(): boolean {
    return this.sentencesAndOffences.some(sentence => SentenceTypes.isSentenceErsedElligible(sentence))
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

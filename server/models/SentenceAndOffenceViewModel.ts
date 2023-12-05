import {
  AnalyzedSentenceAndOffences,
  CalculationSentenceUserInput,
  CalculationUserInputs,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import {
  AnalyzedPrisonApiBookingAndSentenceAdjustments,
  PrisonApiOffenderOffence,
  PrisonApiPrisoner,
  PrisonApiReturnToCustodyDate,
} from '../@types/prisonApi/prisonClientTypes'
import { ErrorMessages } from '../types/ErrorMessages'
import { groupBy, indexBy } from '../utils/utils'
import AdjustmentsViewModel from './AdjustmentsViewModel'
import CalculationQuestionTypes from './CalculationQuestionTypes'
import CourtCaseTableViewModel from './CourtCaseTableViewModel'
import SentenceTypes from './SentenceTypes'

export default class SentenceAndOffenceViewModel {
  public adjustments: AdjustmentsViewModel

  public cases: CourtCaseTableViewModel[]

  public sentenceSequenceToSentence: Map<number, AnalyzedSentenceAndOffences>

  public offenceCount: number

  public returnToCustodyDate?: string

  public sentencesAndOffences: AnalyzedSentenceAndOffences[]

  public constructor(
    public prisonerDetail: PrisonApiPrisoner,
    public userInputs: CalculationUserInputs,
    public dpsEntryPoint: boolean,
    sentencesAndOffences: AnalyzedSentenceAndOffences[],
    adjustments: AnalyzedPrisonApiBookingAndSentenceAdjustments,
    public viewJourney: boolean,
    returnToCustodyDate?: PrisonApiReturnToCustodyDate,
    public validationErrors?: ErrorMessages
  ) {
    this.adjustments = new AdjustmentsViewModel(adjustments, sentencesAndOffences)
    this.cases = Array.from(
      groupBy(sentencesAndOffences, (sent: AnalyzedSentenceAndOffences) => sent.caseSequence).values()
    )
      .map(sentences => new CourtCaseTableViewModel(sentences))
      .sort((a, b) => a.caseSequence - b.caseSequence)
    this.sentenceSequenceToSentence = indexBy(
      sentencesAndOffences,
      (sent: AnalyzedSentenceAndOffences) => sent.sentenceSequence
    )
    const reducer = (previousValue: number, currentValue: AnalyzedSentenceAndOffences) =>
      previousValue + currentValue.offences.length
    this.offenceCount = sentencesAndOffences.reduce(reducer, 0)
    this.returnToCustodyDate = returnToCustodyDate?.returnToCustodyDate
    this.sentencesAndOffences = sentencesAndOffences
  }

  public rowIsSdsPlus(sentence: AnalyzedSentenceAndOffences, offence: PrisonApiOffenderOffence): boolean {
    const input =
      this.userInputs &&
      this.userInputs.sentenceCalculationUserInputs.find((it: CalculationSentenceUserInput) => {
        return it.offenceCode === offence.offenceCode && it.sentenceSequence === sentence.sentenceSequence
      })
    return input && input.userChoice
  }

  public lastUserQuestion(): CalculationQuestionTypes {
    if (this.userInputs) {
      const userInputTypes = CalculationQuestionTypes.getOrderedQuestionTypesFromInputs(this.userInputs)
      return userInputTypes[userInputTypes.length - 1]
    }
    return null
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
    return !this.sentencesAndOffences.every(sentence => sentence.offences.length === 1)
  }

  public getMultipleOffencesToASentence(): object {
    return Array.from(
      groupBy(this.sentencesAndOffences, (sent: AnalyzedSentenceAndOffences) => sent.caseSequence).values()
    )
      .filter((sentences: AnalyzedSentenceAndOffences[]) =>
        sentences.some((sent: AnalyzedSentenceAndOffences) => sent.offences.length > 1)
      )
      .flatMap(sentences =>
        sentences.map((sentence: AnalyzedSentenceAndOffences) => {
          return sentence.offences.length > 1 ? [sentence.caseSequence, sentence.lineSequence] : undefined
        })
      )
      .filter((it: []) => it !== undefined)
  }
}

import {
  CalculationSentenceUserInput,
  CalculationUserInputs,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import {
  AnalyzedPrisonApiBookingAndSentenceAdjustments,
  PrisonApiOffenderOffence,
  PrisonApiOffenderSentenceAndOffences,
  PrisonApiPrisoner,
  PrisonApiReturnToCustodyDate,
} from '../@types/prisonApi/prisonClientTypes'
import { ErrorMessages } from '../types/ErrorMessages'
import { groupBy, indexBy } from '../utils/utils'
import CalculationQuestionTypes from './CalculationQuestionTypes'
import SentenceTypes from './SentenceTypes'
import ViewRouteAdjustmentsViewModel from './ViewRouteAdjustmentsViewModel'
import ViewRouteCourtCaseTableViewModel from './ViewRouteCourtCaseTableViewModel'

export default class ViewRouteSentenceAndOffenceViewModel {
  public adjustments: ViewRouteAdjustmentsViewModel

  public cases: ViewRouteCourtCaseTableViewModel[]

  public sentenceSequenceToSentence: Map<number, PrisonApiOffenderSentenceAndOffences>

  public offenceCount: number

  public returnToCustodyDate?: string

  public sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[]

  public constructor(
    public prisonerDetail: PrisonApiPrisoner,
    public userInputs: CalculationUserInputs,
    public dpsEntryPoint: boolean,
    sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
    adjustments: AnalyzedPrisonApiBookingAndSentenceAdjustments,
    public viewJourney: boolean,
    returnToCustodyDate?: PrisonApiReturnToCustodyDate,
    public validationErrors?: ErrorMessages
  ) {
    this.adjustments = new ViewRouteAdjustmentsViewModel(adjustments, sentencesAndOffences)
    this.cases = Array.from(
      groupBy(sentencesAndOffences, (sent: PrisonApiOffenderSentenceAndOffences) => sent.caseSequence).values()
    )
      .map(sentences => new ViewRouteCourtCaseTableViewModel(sentences))
      .sort((a, b) => a.caseSequence - b.caseSequence)
    this.sentenceSequenceToSentence = indexBy(
      sentencesAndOffences,
      (sent: PrisonApiOffenderSentenceAndOffences) => sent.sentenceSequence
    )
    const reducer = (previousValue: number, currentValue: PrisonApiOffenderSentenceAndOffences) =>
      previousValue + currentValue.offences.length
    this.offenceCount = sentencesAndOffences.reduce(reducer, 0)
    this.returnToCustodyDate = returnToCustodyDate?.returnToCustodyDate
    this.sentencesAndOffences = sentencesAndOffences
  }

  public rowIsSdsPlus(sentence: PrisonApiOffenderSentenceAndOffences, offence: PrisonApiOffenderOffence): boolean {
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
      groupBy(this.sentencesAndOffences, (sent: PrisonApiOffenderSentenceAndOffences) => sent.caseSequence).values()
    )
      .filter((sentences: PrisonApiOffenderSentenceAndOffences[]) =>
        sentences.some((sent: PrisonApiOffenderSentenceAndOffences) => sent.offences.length > 1)
      )
      .flatMap(sentences =>
        sentences.map((sentence: PrisonApiOffenderSentenceAndOffences) => {
          return sentence.offences.length > 1 ? [sentence.caseSequence, sentence.lineSequence] : undefined
        })
      )
      .filter((it: []) => it !== undefined)
  }
}

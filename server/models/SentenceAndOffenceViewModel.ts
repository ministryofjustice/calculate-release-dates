import {
  CalculationSentenceUserInput,
  CalculationUserInputs,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/PrisonApiOffenderSentenceAndOffences'
import {
  PrisonApiBookingAndSentenceAdjustments,
  PrisonApiOffenderOffence,
  PrisonApiPrisoner,
  PrisonApiReturnToCustodyDate,
} from '../@types/prisonApi/prisonClientTypes'
import { groupBy, indexBy } from '../utils/utils'
import AdjustmentsViewModel from './AdjustmentsViewModel'
import CalculationQuestionTypes from './CalculationQuestionTypes'
import CourtCaseTableViewModel from './CourtCaseTableViewModel'

export default class SentenceAndOffenceViewModel {
  public adjustments: AdjustmentsViewModel

  public cases: CourtCaseTableViewModel[]

  public sentenceSequenceToSentence: Map<number, PrisonApiOffenderSentenceAndOffences>

  public offenceCount: number

  public returnToCustodyDate?: string

  public constructor(
    public prisonerDetail: PrisonApiPrisoner,
    public userInputs: CalculationUserInputs,
    sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
    adjustments: PrisonApiBookingAndSentenceAdjustments,
    returnToCustodyDate?: PrisonApiReturnToCustodyDate,
  ) {
    this.adjustments = new AdjustmentsViewModel(adjustments, sentencesAndOffences)
    this.cases = Array.from(
      groupBy(sentencesAndOffences, (sent: PrisonApiOffenderSentenceAndOffences) => sent.caseSequence).values(),
    )
      .map(sentences => new CourtCaseTableViewModel(sentences))
      .sort((a, b) => a.caseSequence - b.caseSequence)
    this.sentenceSequenceToSentence = indexBy(
      sentencesAndOffences,
      (sent: PrisonApiOffenderSentenceAndOffences) => sent.sentenceSequence,
    )
    const reducer = (previousValue: number, currentValue: PrisonApiOffenderSentenceAndOffences) =>
      previousValue + currentValue.offences.length
    this.offenceCount = sentencesAndOffences.reduce(reducer, 0)
    this.returnToCustodyDate = returnToCustodyDate?.returnToCustodyDate
  }

  public rowIsSdsPlus = function rowIsSdsPlus(
    userInputs: CalculationUserInputs,
    sentence: PrisonApiOffenderSentenceAndOffences,
    offence: PrisonApiOffenderOffence,
  ): boolean {
    const input =
      userInputs &&
      userInputs.sentenceCalculationUserInputs.find((it: CalculationSentenceUserInput) => {
        return it.offenceCode === offence.offenceCode && it.sentenceSequence === sentence.sentenceSequence
      })
    return input && input.userChoice
  }

  public lastUserQuestion = function lastUserQuestion(userInputs: CalculationUserInputs): CalculationQuestionTypes {
    if (userInputs) {
      const userInputTypes = CalculationQuestionTypes.getOrderedQuestionTypesFromInputs(userInputs)
      return userInputTypes[userInputTypes.length - 1]
    }
    return null
  }
}

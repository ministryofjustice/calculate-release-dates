import {
  CalculationUserInputs,
  CalculationUserQuestions,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/PrisonApiOffenderSentenceAndOffences'
import { PrisonApiOffenderOffence } from '../@types/prisonApi/prisonClientTypes'
import { groupBy } from '../utils/utils'
import CourtCaseTableViewModel from './CourtCaseTableViewModel'

export default class CalculationQuestionsViewModel {
  public cases: CourtCaseTableViewModel[]

  constructor(
    sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
    calculationQuestions: CalculationUserQuestions,
    private userInputs: CalculationUserInputs
  ) {
    const filteredSentences = sentencesAndOffences.filter(sentence => {
      return !!calculationQuestions.sentenceQuestions.find(
        question => question.sentenceSequence === sentence.sentenceSequence
      )
    })
    this.cases = Array.from(
      groupBy(filteredSentences, (sent: PrisonApiOffenderSentenceAndOffences) => sent.caseSequence).values()
    )
      .map(sentences => new CourtCaseTableViewModel(sentences))
      .sort((a, b) => a.caseSequence - b.caseSequence)
  }

  public isCheckboxChecked(sentence: PrisonApiOffenderSentenceAndOffences, offence: PrisonApiOffenderOffence) {
    const input =
      this.userInputs &&
      this.userInputs.sentenceCalculationUserInputs.find(it => {
        return it.offenceCode === offence.offenceCode && it.sentenceSequence === sentence.sentenceSequence
      })
    return input && input.isScheduleFifteenMaximumLife
  }

  public isSelectAllChecked(): boolean {
    return (
      this.userInputs &&
      this.userInputs.sentenceCalculationUserInputs.filter(it => it.isScheduleFifteenMaximumLife).length ===
        this.userInputs.sentenceCalculationUserInputs.length
    )
  }
}

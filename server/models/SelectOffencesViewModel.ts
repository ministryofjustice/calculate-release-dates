import {
  AnalyzedSentenceAndOffences,
  CalculationUserInputs,
  CalculationUserQuestions,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { PrisonApiOffenderOffence, PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'
import { groupBy } from '../utils/utils'
import AbstractSelectOffencesViewModel from './AbstractSelectOffencesViewModel'
import CalculationQuestionTypes from './CalculationQuestionTypes'
import CourtCaseTableViewModel from './CourtCaseTableViewModel'

export default class SelectOffencesViewModel extends AbstractSelectOffencesViewModel {
  public cases: CourtCaseTableViewModel[]

  constructor(
    sentencesAndOffences: AnalyzedSentenceAndOffences[],
    calculationQuestions: CalculationUserQuestions,
    public calculationQuestionType: CalculationQuestionTypes,
    private userInputs: CalculationUserInputs,
  ) {
    super(calculationQuestions)
    const filteredSentences = sentencesAndOffences.filter(sentence => {
      return !!calculationQuestions.sentenceQuestions.find(
        question =>
          question.sentenceSequence === sentence.sentenceSequence &&
          question.userInputType === calculationQuestionType.apiType,
      )
    })
    this.cases = Array.from(
      groupBy(filteredSentences, (sent: PrisonApiOffenderSentenceAndOffences) => sent.caseSequence).values(),
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
    return input && input.userInputType === this.calculationQuestionType.apiType && input.userChoice
  }

  public isNoneCheckboxChecked(): boolean {
    const sentences = this.cases
      .map(it => it.sentences.map(sentence => sentence.sentencesAndOffence.sentenceSequence))
      .reduce((acc, value) => acc.concat(value), [])
    const userInputsForThisQuestion =
      this.userInputs &&
      this.userInputs.sentenceCalculationUserInputs.filter(it => sentences.includes(it.sentenceSequence))
    return (
      userInputsForThisQuestion &&
      userInputsForThisQuestion.length > 0 &&
      !userInputsForThisQuestion.find(it => it.userChoice)
    )
  }

  public previousQuestion(): CalculationQuestionTypes {
    const index = this.userInputTypes.indexOf(this.calculationQuestionType)

    if (index === 0) {
      // first question
      return null
    }
    return this.userInputTypes[index - 1]
  }

  public isOriginal(): boolean {
    return this.calculationQuestionType === CalculationQuestionTypes.ORIGINAL
  }

  public isFourToUnderSeven(): boolean {
    return this.calculationQuestionType === CalculationQuestionTypes.FOUR_TO_UNDER_SEVEN
  }

  public isSection250(): boolean {
    return this.calculationQuestionType === CalculationQuestionTypes.SECTION_250
  }

  public isUpdated(): boolean {
    return this.calculationQuestionType === CalculationQuestionTypes.UPDATED
  }
}

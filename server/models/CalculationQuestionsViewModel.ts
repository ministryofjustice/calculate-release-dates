import { CalculationUserQuestions } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/PrisonApiOffenderSentenceAndOffences'

export default class CalculationQuestionsViewModel {
  public sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[]

  constructor(
    sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
    calculationQuestions: CalculationUserQuestions
  ) {
    this.sentencesAndOffences = sentencesAndOffences.filter(sentence => {
      return !!calculationQuestions.sentenceQuestions.find(
        question => question.sentenceSequence === sentence.sentenceSequence
      )
    })
  }
}

import { CalculationUserQuestions } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import CalculationQuestionTypes from './CalculationQuestionTypes'

export default abstract class AbstractSelectOffencesViewModel {
  protected readonly userInputTypes: CalculationQuestionTypes[]

  constructor(calculationQuestions: CalculationUserQuestions) {
    this.userInputTypes = CalculationQuestionTypes.getOrderedQuestionTypesFromQuestions(calculationQuestions)
  }

  public hasMoreThanOneQuestion(): boolean {
    return this.userInputTypes.length > 1
  }

  public firstQuestion(): CalculationQuestionTypes {
    return this.userInputTypes[0]
  }
}

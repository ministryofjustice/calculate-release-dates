import {
  CalculationUserInputs,
  CalculationUserQuestions,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { unique } from '../utils/utils'

export default class CalculationQuestionTypes {
  private constructor(
    public readonly apiType: 'ORIGINAL' | 'FOUR_TO_UNDER_SEVEN' | 'SECTION_250' | 'UPDATED',
    public readonly url: 'list-a' | 'list-b' | 'list-c' | 'list-d',
    public readonly text: 'List A' | 'List B' | 'List C' | 'List D',
    public readonly textLower: 'list A' | 'list B' | 'list C' | 'list D'
  ) {}

  public static ORIGINAL = new CalculationQuestionTypes('ORIGINAL', 'list-a', 'List A', 'list A')

  public static FOUR_TO_UNDER_SEVEN = new CalculationQuestionTypes('FOUR_TO_UNDER_SEVEN', 'list-b', 'List B', 'list B')

  public static SECTION_250 = new CalculationQuestionTypes('SECTION_250', 'list-c', 'List C', 'list C')

  public static UPDATED = new CalculationQuestionTypes('UPDATED', 'list-d', 'List D', 'list D')

  public static ORDERED_TYPES = [this.ORIGINAL, this.FOUR_TO_UNDER_SEVEN, this.SECTION_250, this.UPDATED]

  public static getOrderedQuestionTypesFromQuestions(
    calculationQuestions: CalculationUserQuestions
  ): CalculationQuestionTypes[] {
    return this.getOrderedQuestionTypes(calculationQuestions.sentenceQuestions)
  }

  public static getOrderedQuestionTypesFromInputs(userInputs: CalculationUserInputs): CalculationQuestionTypes[] {
    return this.getOrderedQuestionTypes(userInputs.sentenceCalculationUserInputs)
  }

  private static getOrderedQuestionTypes(
    questions: {
      userInputType: 'ORIGINAL' | 'FOUR_TO_UNDER_SEVEN' | 'SECTION_250' | 'UPDATED'
    }[]
  ): CalculationQuestionTypes[] {
    return questions
      .map(question => question.userInputType)
      .filter(unique)
      .map(CalculationQuestionTypes.fromApiType)
      .sort((t1, t2) => {
        if (CalculationQuestionTypes.ORDERED_TYPES.indexOf(t1) > CalculationQuestionTypes.ORDERED_TYPES.indexOf(t2)) {
          return 1
        }
        return -1
      })
  }

  public static fromApiType(
    apiType: 'ORIGINAL' | 'FOUR_TO_UNDER_SEVEN' | 'SECTION_250' | 'UPDATED'
  ): CalculationQuestionTypes {
    return CalculationQuestionTypes.ORDERED_TYPES.find(type => type.apiType === apiType)
  }
}

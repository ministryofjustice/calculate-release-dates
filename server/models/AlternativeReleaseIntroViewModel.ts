import { CalculationUserQuestions } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { unique } from '../utils/utils'

export default class AlternativeReleaseIntroViewModel {
  private userInputTypes: Array<'ORIGINAL' | 'FOUR_TO_UNDER_SEVEN' | 'SECTION_250' | 'UPDATED'>

  constructor(calculationQuestions: CalculationUserQuestions) {
    this.userInputTypes = calculationQuestions.sentenceQuestions
      .map(question => question.userInputType)
      .filter(unique) as Array<'ORIGINAL' | 'FOUR_TO_UNDER_SEVEN' | 'SECTION_250' | 'UPDATED'>
  }

  public hasOriginal(): boolean {
    return this.userInputTypes.includes('ORIGINAL')
  }

  public hasFourToUnderSeven(): boolean {
    return this.userInputTypes.includes('FOUR_TO_UNDER_SEVEN')
  }

  public hasSection250(): boolean {
    return this.userInputTypes.includes('SECTION_250')
  }

  public hasUpdated(): boolean {
    return this.userInputTypes.includes('UPDATED')
  }

  public hasMoreThanOneQuestion(): boolean {
    return this.userInputTypes.length > 1
  }

  public firstQuestion(): string {
    return this.userInputTypes[0]
  }
}

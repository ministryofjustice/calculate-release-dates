import AbstractSelectOffencesViewModel from './AbstractSelectOffencesViewModel'
import CalculationQuestionTypes from './CalculationQuestionTypes'

export default class AlternativeReleaseIntroViewModel extends AbstractSelectOffencesViewModel {
  public hasOriginal(): boolean {
    return this.userInputTypes.includes(CalculationQuestionTypes.ORIGINAL)
  }

  public hasFourToUnderSeven(): boolean {
    return this.userInputTypes.includes(CalculationQuestionTypes.FOUR_TO_UNDER_SEVEN)
  }

  public hasSection250(): boolean {
    return this.userInputTypes.includes(CalculationQuestionTypes.SECTION_250)
  }

  public hasUpdated(): boolean {
    return this.userInputTypes.includes(CalculationQuestionTypes.UPDATED)
  }

  public hasMoreThanOneQuestion(): boolean {
    return this.userInputTypes.length > 1
  }

  public firstQuestion(): CalculationQuestionTypes {
    return this.userInputTypes[0]
  }
}

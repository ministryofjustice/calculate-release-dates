import { Request, Response } from 'express'
import CalculateReleaseDatesService from './calculateReleaseDatesService'
import UserInputService from './userInputService'
import {
  CalculationUserInputs,
  CalculationUserQuestions,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { arraysContainSameItemsAsStrings, unique } from '../utils/utils'

export default class QuestionsService {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly userInputService: UserInputService,
  ) {
    // intentionally blank
  }

  public async checkQuestions(req: Request, res: Response): Promise<boolean> {
    const { nomsId } = req.params
    const { token } = res.locals.user

    const calculationQuestions = await this.calculateReleaseDatesService.getCalculationUserQuestions(nomsId, token)
    const userInputs = this.userInputService.getCalculationUserInputForPrisoner(req, nomsId)
    const aQuestionIsRequiredOrHasBeenAnswered =
      calculationQuestions.sentenceQuestions.length || userInputs?.sentenceCalculationUserInputs?.length
    if (
      aQuestionIsRequiredOrHasBeenAnswered &&
      !(await this.allQuestionsHaveBeenAnswered(calculationQuestions, userInputs))
    ) {
      this.userInputService.resetCalculationUserInputForPrisoner(req, nomsId)
      return true
    }
    return false
  }

  private async allQuestionsHaveBeenAnswered(
    calculationQuestions: CalculationUserQuestions,
    userInputs: CalculationUserInputs,
  ): Promise<boolean> {
    if (!userInputs) {
      return calculationQuestions.sentenceQuestions.length === 0
    }

    const questions: string[] = calculationQuestions.sentenceQuestions
      .map(it => {
        return `${it.sentenceSequence}${it.userInputType}`
      })
      .filter(unique)

    const inputs: string[] = userInputs.sentenceCalculationUserInputs
      .map(it => {
        return `${it.sentenceSequence}${it.userInputType}`
      })
      .filter(unique)

    return arraysContainSameItemsAsStrings(questions, inputs)
  }
}

import { RequestHandler } from 'express'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import PrisonerService from '../services/prisonerService'
import CalculationQuestionsViewModel from '../models/CalculationQuestionsViewModel'
import {
  CalculationSentenceUserInput,
  CalculationUserInputs,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import UserInputService from '../services/userInputService'
import config from '../config'

export default class CalculationQuestionRoutes {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
    private readonly userInputService: UserInputService
  ) {}

  public calculationQuestions: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId } = req.params
    if (!config.featureToggles.sdsPlusQuestion) {
      return res.redirect(`/calculation/${nomsId}/check-information`)
    }
    const calculationQuestions = await this.calculateReleaseDatesService.getCalculationUserQuestions(nomsId, token)
    if (calculationQuestions.sentenceQuestions.length === 0) {
      return res.redirect(`/calculation/${nomsId}/check-information`)
    }
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffences(
      username,
      prisonerDetail.bookingId,
      token
    )
    const userInputs = this.userInputService.getCalculationUserInputForPrisoner(req, nomsId)
    const model = new CalculationQuestionsViewModel(sentencesAndOffences, calculationQuestions, userInputs)
    return res.render('pages/questions/calculationQuestions', { model })
  }

  public submitUserInput: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffences(
      username,
      prisonerDetail.bookingId,
      token
    )

    const offences = sentencesAndOffences
      .map(sentence =>
        sentence.offences.map(offence => {
          return { sentence, offence }
        })
      )
      .reduce((acc, value) => acc.concat(value), [])

    const userInput = {
      sentenceCalculationUserInputs: req.body.charges
        .map((it: string) => {
          const item = offences.find(o => !!Number(it) && o.offence.offenderChargeId === Number(it))
          if (item) {
            return {
              offenceCode: item.offence.offenceCode,
              sentenceSequence: item.sentence.sentenceSequence,
              isScheduleFifteenMaximumLife: !!req.body[item.offence.offenderChargeId],
            } as CalculationSentenceUserInput
          }
          return null
        })
        .filter((it: CalculationSentenceUserInput) => !!it),
    } as CalculationUserInputs

    this.userInputService.setCalculationUserInputForPrisoner(req, nomsId, userInput)

    return res.redirect(`/calculation/${nomsId}/check-information`)
  }
}

import { RequestHandler } from 'express'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import PrisonerService from '../services/prisonerService'
import {
  CalculationSentenceUserInput,
  CalculationUserInputs,
  CalculationUserQuestions,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import UserInputService from '../services/userInputService'
import EntryPointService from '../services/entryPointService'
import AlternativeReleaseIntroViewModel from '../models/AlternativeReleaseIntroViewModel'
import CalculationQuestionTypes from '../models/CalculationQuestionTypes'
import SelectOffencesViewModel from '../models/SelectOffencesViewModel'

export default class CalculationQuestionRoutes {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
    private readonly entryPointService: EntryPointService,
    private readonly userInputService: UserInputService
  ) {}

  private handleListRequest = (type: CalculationQuestionTypes): RequestHandler => {
    return async (req, res): Promise<void> => {
      const { username, caseloads, token } = res.locals.user
      const { nomsId } = req.params
      const calculationQuestions = await this.calculateReleaseDatesService.getCalculationUserQuestions(nomsId, token)

      if (calculationQuestions.sentenceQuestions.length === 0) {
        return res.redirect(`/calculation/${nomsId}/check-information`)
      }
      if (!calculationQuestions.sentenceQuestions.find(question => question.userInputType === type.apiType)) {
        return res.redirect(`/calculation/${nomsId}/alternative-release-arangements`)
      }
      const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
      const sentencesAndOffences = await this.prisonerService.getSentencesAndOffences(
        username,
        prisonerDetail.bookingId,
        token
      )
      const userInputs = this.userInputService.getCalculationUserInputForPrisoner(req, nomsId)
      const model = new SelectOffencesViewModel(sentencesAndOffences, calculationQuestions, type, userInputs)
      return res.render('pages/questions/selectOffences', {
        model,
        prisonerDetail,
      })
    }
  }

  public selectOffencesInListA: RequestHandler = this.handleListRequest(CalculationQuestionTypes.ORIGINAL)

  public selectOffencesInListB: RequestHandler = this.handleListRequest(CalculationQuestionTypes.FOUR_TO_UNDER_SEVEN)

  public selectOffencesInListC: RequestHandler = this.handleListRequest(CalculationQuestionTypes.SECTION_250)

  public selectOffencesInListD: RequestHandler = this.handleListRequest(CalculationQuestionTypes.UPDATED)

  private handleSubmitOffences = (type: CalculationQuestionTypes): RequestHandler => {
    return async (req, res): Promise<void> => {
      const { username, caseloads, token } = res.locals.user
      const { nomsId } = req.params
      const calculationQuestions = await this.calculateReleaseDatesService.getCalculationUserQuestions(nomsId, token)
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

      if (typeof req.body.charges === 'string') {
        // Charges comes through as a string if there is only 1 row.
        req.body.charges = [req.body.charges]
      }

      const userInputs =
        this.userInputService.getCalculationUserInputForPrisoner(req, nomsId) ||
        ({ sentenceCalculationUserInputs: [] } as CalculationUserInputs)

      // Clear existing answers to this question
      userInputs.sentenceCalculationUserInputs = userInputs.sentenceCalculationUserInputs.filter(
        question => question.userInputType !== type.apiType
      )

      userInputs.sentenceCalculationUserInputs = [
        ...userInputs.sentenceCalculationUserInputs,
        ...req.body.charges
          .map((it: string) => {
            const item = offences.find(o => !!Number(it) && o.offence.offenderChargeId === Number(it))
            if (item) {
              return {
                offenceCode: item.offence.offenceCode,
                sentenceSequence: item.sentence.sentenceSequence,
                userInputType: type.apiType,
                userChoice: !!req.body[item.offence.offenderChargeId],
              } as CalculationSentenceUserInput
            }
            return null
          })
          .filter((it: CalculationSentenceUserInput) => !!it),
      ]

      this.userInputService.setCalculationUserInputForPrisoner(req, nomsId, userInputs)

      const nextQuestion = this.nextQuestion(calculationQuestions, type)
      if (nextQuestion) {
        return res.redirect(`/calculation/${nomsId}/select-offences-that-appear-in-${nextQuestion.url}`)
      }
      return res.redirect(`/calculation/${nomsId}/check-information`)
    }
  }

  private nextQuestion(
    calculationQuestions: CalculationUserQuestions,
    calculationQuestionType: CalculationQuestionTypes
  ): CalculationQuestionTypes {
    const userInputTypes = CalculationQuestionTypes.getOrderedQuestionTypesFromQuestions(calculationQuestions)
    const index = userInputTypes.indexOf(calculationQuestionType)
    if (index === userInputTypes.length - 1) {
      // last question
      return null
    }
    return userInputTypes[index + 1]
  }

  public submitOffencesInListA: RequestHandler = this.handleSubmitOffences(CalculationQuestionTypes.ORIGINAL)

  public submitOffencesInListB: RequestHandler = this.handleSubmitOffences(CalculationQuestionTypes.FOUR_TO_UNDER_SEVEN)

  public submitOffencesInListC: RequestHandler = this.handleSubmitOffences(CalculationQuestionTypes.SECTION_250)

  public submitOffencesInListD: RequestHandler = this.handleSubmitOffences(CalculationQuestionTypes.UPDATED)

  public alternativeReleaseIntro: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const calculationQuestions = await this.calculateReleaseDatesService.getCalculationUserQuestions(nomsId, token)

    if (calculationQuestions.sentenceQuestions.length === 0) {
      return res.redirect(`/calculation/${nomsId}/check-information`)
    }

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    const model = new AlternativeReleaseIntroViewModel(calculationQuestions)
    return res.render('pages/questions/alternativeReleaseIntro', {
      model,
      prisonerDetail,
      dpsEntryPoint: this.entryPointService.isDpsEntryPoint(req),
    })
  }
}

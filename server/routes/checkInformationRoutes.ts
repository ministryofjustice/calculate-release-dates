import { RequestHandler } from 'express'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import PrisonerService from '../services/prisonerService'
import EntryPointService from '../services/entryPointService'
import SentenceAndOffenceViewModel from '../models/SentenceAndOffenceViewModel'
import { ErrorMessages } from '../types/ErrorMessages'
import UserInputService from '../services/userInputService'
import {
  CalculationUserInputs,
  CalculationUserQuestions,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { arraysContainSameItemsAsStrings, unique } from '../utils/utils'
import SentenceTypes from '../models/SentenceTypes'
import config from '../config'

export default class CheckInformationRoutes {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
    private readonly entryPointService: EntryPointService,
    private readonly userInputService: UserInputService
  ) {
    // intentionally left blank
  }

  public checkInformation: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId } = req.params
    if (config.featureToggles.manualEntry) {
      const unsupportedSentenceOrCalculationMessages =
        await this.calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages(nomsId, token)
      if (unsupportedSentenceOrCalculationMessages.length > 0) {
        return res.redirect(`/calculation/${nomsId}/check-information-unsupported`)
      }
    }

    const calculationQuestions = await this.calculateReleaseDatesService.getCalculationUserQuestions(nomsId, token)
    const userInputs = this.userInputService.getCalculationUserInputForPrisoner(req, nomsId)
    const aQuestionIsRequiredOrHasBeenAnswered =
      calculationQuestions.sentenceQuestions.length || userInputs?.sentenceCalculationUserInputs?.length
    if (
      aQuestionIsRequiredOrHasBeenAnswered &&
      !(await this.allQuestionsHaveBeenAnswered(calculationQuestions, userInputs))
    ) {
      this.userInputService.resetCalculationUserInputForPrisoner(req, nomsId)
      return res.redirect(`/calculation/${nomsId}/alternative-release-arrangements`)
    }
    if (config.featureToggles.approvedDates) {
      if (!req.session.selectedApprovedDates) {
        req.session.selectedApprovedDates = {}
      }
      req.session.selectedApprovedDates[nomsId] = []
    }
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    const sentencesAndOffences = await this.prisonerService.getActiveSentencesAndOffences(
      username,
      prisonerDetail.bookingId,
      token
    )
    const adjustmentDetails = await this.prisonerService.getBookingAndSentenceAdjustments(
      prisonerDetail.bookingId,
      token
    )
    const returnToCustody = sentencesAndOffences.filter(s => SentenceTypes.isSentenceFixedTermRecall(s)).length
      ? await this.prisonerService.getReturnToCustodyDate(prisonerDetail.bookingId, token)
      : null

    let validationMessages: ErrorMessages
    if (req.query.hasErrors) {
      validationMessages = await this.calculateReleaseDatesService.validateBackend(nomsId, userInputs, token)
    } else {
      validationMessages = null
    }

    return res.render('pages/calculation/checkInformation', {
      model: new SentenceAndOffenceViewModel(
        prisonerDetail,
        userInputs,
        this.entryPointService.isDpsEntryPoint(req),
        sentencesAndOffences,
        adjustmentDetails,
        false,
        returnToCustody,
        validationMessages
      ),
    })
  }

  public unsupportedCheckInformation: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const unsupportedSentenceOrCalculationMessages =
      await this.calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages(nomsId, token)
    if (unsupportedSentenceOrCalculationMessages.length === 0) {
      return res.redirect(`/calculation/${nomsId}/check-information`)
    }
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    const userInputs = this.userInputService.getCalculationUserInputForPrisoner(req, nomsId)
    const sentencesAndOffences = await this.prisonerService.getActiveSentencesAndOffences(
      username,
      prisonerDetail.bookingId,
      token
    )
    const adjustmentDetails = await this.prisonerService.getBookingAndSentenceAdjustments(
      prisonerDetail.bookingId,
      token
    )
    const returnToCustody = sentencesAndOffences.filter(s => SentenceTypes.isSentenceFixedTermRecall(s)).length
      ? await this.prisonerService.getReturnToCustodyDate(prisonerDetail.bookingId, token)
      : null

    let validationMessages: ErrorMessages
    if (req.query.hasErrors) {
      validationMessages = await this.calculateReleaseDatesService.validateBackend(
        nomsId,
        {} as CalculationUserInputs,
        token
      )
    } else {
      validationMessages = null
    }
    return res.render('pages/manualEntry/checkInformationUnsupported', {
      model: new SentenceAndOffenceViewModel(
        prisonerDetail,
        userInputs,
        this.entryPointService.isDpsEntryPoint(req),
        sentencesAndOffences,
        adjustmentDetails,
        false,
        returnToCustody,
        validationMessages
      ),
    })
  }

  public submitUnsupportedCheckInformation: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    return res.redirect(`/calculation/${nomsId}/manual-entry`)
  }

  public submitCheckInformation: RequestHandler = async (req, res): Promise<void> => {
    const { username, token } = res.locals.user
    const { nomsId } = req.params

    const userInputs = this.userInputService.getCalculationUserInputForPrisoner(req, nomsId)
    userInputs.calculateErsed = req.body.ersed === 'true'
    this.userInputService.setCalculationUserInputForPrisoner(req, nomsId, userInputs)

    const errors = await this.calculateReleaseDatesService.validateBackend(nomsId, userInputs, token)
    if (errors.messages.length > 0) {
      return res.redirect(`/calculation/${nomsId}/check-information?hasErrors=true`)
    }

    const releaseDates = await this.calculateReleaseDatesService.calculatePreliminaryReleaseDates(
      username,
      nomsId,
      userInputs,
      token
    )
    return res.redirect(`/calculation/${nomsId}/summary/${releaseDates.calculationRequestId}`)
  }

  private async allQuestionsHaveBeenAnswered(
    calculationQuestions: CalculationUserQuestions,
    userInputs: CalculationUserInputs
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

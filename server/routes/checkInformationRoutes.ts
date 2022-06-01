import { RequestHandler } from 'express'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import PrisonerService from '../services/prisonerService'
import EntryPointService from '../services/entryPointService'
import SentenceAndOffenceViewModel from '../models/SentenceAndOffenceViewModel'
import { ErrorMessages } from '../types/ErrorMessages'
import SentenceRowViewModel from '../models/SentenceRowViewModel'
import UserInputService from '../services/userInputService'

export default class CheckInformationRoutes {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
    private readonly entryPointService: EntryPointService,
    private readonly userInputService: UserInputService
  ) {}

  public checkInformation: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffences(
      username,
      prisonerDetail.bookingId,
      token
    )
    const adjustmentDetails = await this.prisonerService.getBookingAndSentenceAdjustments(
      prisonerDetail.bookingId,
      token
    )
    const returnToCustody = sentencesAndOffences.filter(s => SentenceRowViewModel.isSentenceFixedTermRecall(s)).length
      ? await this.prisonerService.getReturnToCustodyDate(prisonerDetail.bookingId, token)
      : null
    const userInputs = this.userInputService.getCalculationUserInputForPrisoner(req, nomsId)

    let validationMessages: ErrorMessages
    if (req.query.hasErrors) {
      validationMessages = await this.calculateReleaseDatesService.validateBackend(
        nomsId,
        userInputs,
        sentencesAndOffences,
        token
      )
    } else {
      validationMessages = null
    }

    res.render('pages/calculation/checkInformation', {
      ...new SentenceAndOffenceViewModel(prisonerDetail, sentencesAndOffences, adjustmentDetails, returnToCustody),
      dpsEntryPoint: this.entryPointService.isDpsEntryPoint(req),
      validationErrors: validationMessages,
      userInputs,
    })
  }

  public submitCheckInformation: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId } = req.params

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffences(
      username,
      prisonerDetail.bookingId,
      token
    )
    const userInputs = this.userInputService.getCalculationUserInputForPrisoner(req, nomsId)
    const errors = await this.calculateReleaseDatesService.validateBackend(
      nomsId,
      userInputs,
      sentencesAndOffences,
      token
    )
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
}

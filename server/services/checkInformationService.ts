import { Request, Response } from 'express'
import SentenceAndOffenceViewModel from '../models/SentenceAndOffenceViewModel'
import SentenceTypes from '../models/SentenceTypes'
import { ErrorMessages } from '../types/ErrorMessages'
import CalculateReleaseDatesService from './calculateReleaseDatesService'
import PrisonerService from './prisonerService'
import UserInputService from './userInputService'
import { CalculationUserInputs } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

export default class CheckInformationService {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
    private readonly userInputService: UserInputService,
  ) {
    // intentionally blank
  }

  public async checkInformation(
    req: Request,
    res: Response,
    requireUserInputs: boolean,
    suppressSentenceTypeOrCalcErrors: boolean = false,
  ): Promise<SentenceAndOffenceViewModel> {
    const { caseloads, token, userRoles } = res.locals.user
    const { calculationReference } = req.params
    let { nomsId } = req.params
    if (!req.session.selectedApprovedDates) {
      req.session.selectedApprovedDates = {}
    }
    req.session.selectedApprovedDates[nomsId] = []

    const prisonerId =
      nomsId ??
      (await this.calculateReleaseDatesService.getCalculationResultsByReference(calculationReference, token)).prisonerId

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(prisonerId, token, caseloads, userRoles)
    nomsId = prisonerId

    const [sentencesAndOffences, adjustmentDetails, ersedAvailable] = await Promise.all([
      this.calculateReleaseDatesService.getActiveAnalysedSentencesAndOffences(prisonerDetail.bookingId, token),
      this.calculateReleaseDatesService.getBookingAndSentenceAdjustments(prisonerDetail.bookingId, token),
      this.calculateReleaseDatesService.getErsedEligibility(prisonerDetail.bookingId, token),
    ])

    const returnToCustody = sentencesAndOffences.filter(s => SentenceTypes.isSentenceFixedTermRecall(s)).length
      ? await this.prisonerService.getReturnToCustodyDate(prisonerDetail.bookingId, token)
      : null

    const userInputs = requireUserInputs
      ? this.userInputService.getCalculationUserInputForPrisoner(req, nomsId)
      : ({ sentenceCalculationUserInputs: [] } as CalculationUserInputs)

    let validationMessages: ErrorMessages = null

    if (req.query.hasErrors) {
      if (suppressSentenceTypeOrCalcErrors) {
        validationMessages = await this.calculateReleaseDatesService.validateBookingForManualEntry(nomsId, token)
      } else {
        validationMessages = await this.calculateReleaseDatesService.validateBackend(nomsId, userInputs, token)
      }
    }

    return new SentenceAndOffenceViewModel(
      prisonerDetail,
      userInputs,
      sentencesAndOffences,
      adjustmentDetails,
      false,
      ersedAvailable.isValid,
      returnToCustody,
      validationMessages,
    )
  }
}

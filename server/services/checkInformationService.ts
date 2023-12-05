import { Request, Response } from 'express'
import SentenceAndOffenceViewModel from '../models/SentenceAndOffenceViewModel'
import config from '../config'
import SentenceTypes from '../models/SentenceTypes'
import { ErrorMessages } from '../types/ErrorMessages'
import CalculateReleaseDatesService from './calculateReleaseDatesService'
import PrisonerService from './prisonerService'
import EntryPointService from './entryPointService'
import UserInputService from './userInputService'
import { CalculationUserInputs } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

export default class CheckInformationService {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
    private readonly entryPointService: EntryPointService,
    private readonly userInputService: UserInputService
  ) {
    // intentionally blank
  }

  public async checkInformation(
    req: Request,
    res: Response,
    requireUserInputs: boolean
  ): Promise<SentenceAndOffenceViewModel> {
    const { username, caseloads, token } = res.locals.user
    const { calculationReference } = req.params
    let { nomsId } = req.params
    if (config.featureToggles.approvedDates) {
      if (!req.session.selectedApprovedDates) {
        req.session.selectedApprovedDates = {}
      }
      req.session.selectedApprovedDates[nomsId] = []
    }
    let prisonerDetail
    if (nomsId) {
      prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    } else {
      const calculation = await this.calculateReleaseDatesService.getCalculationResultsByReference(
        username,
        calculationReference,
        token
      )
      prisonerDetail = await this.prisonerService.getPrisonerDetail(username, calculation.prisonerId, caseloads, token)
      nomsId = calculation.prisonerId
    }

    const sentencesAndOffences = await this.calculateReleaseDatesService.getActiveAnalyzedSentencesAndOffences(
      username,
      prisonerDetail.bookingId,
      token
    )
    const adjustmentDetails = await this.calculateReleaseDatesService.getBookingAndSentenceAdjustments(
      prisonerDetail.bookingId,
      token
    )
    const returnToCustody = sentencesAndOffences.filter(s => SentenceTypes.isSentenceFixedTermRecall(s)).length
      ? await this.prisonerService.getReturnToCustodyDate(prisonerDetail.bookingId, token)
      : null

    let validationMessages: ErrorMessages
    const userInputs = requireUserInputs
      ? this.userInputService.getCalculationUserInputForPrisoner(req, nomsId)
      : ({ sentenceCalculationUserInputs: [] } as CalculationUserInputs)
    if (req.query.hasErrors) {
      validationMessages = await this.calculateReleaseDatesService.validateBackend(nomsId, userInputs, token)
    } else {
      validationMessages = null
    }

    return new SentenceAndOffenceViewModel(
      prisonerDetail,
      userInputs,
      this.entryPointService.isDpsEntryPoint(req),
      sentencesAndOffences,
      adjustmentDetails,
      false,
      returnToCustody,
      validationMessages
    )
  }
}

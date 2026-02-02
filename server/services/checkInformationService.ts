import SentenceAndOffenceViewModel from '../models/SentenceAndOffenceViewModel'
import SentenceTypes from '../models/SentenceTypes'
import { ErrorMessages } from '../types/ErrorMessages'
import CalculateReleaseDatesService from './calculateReleaseDatesService'
import PrisonerService from './prisonerService'
import config from '../config'
import { CalculationUserInputs } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { convertValidationToErrorMessages } from '../utils/utils'

export default class CheckInformationService {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
  ) {
    // intentionally blank
  }

  public async checkInformation(
    nomsId: string,
    userInputs: CalculationUserInputs,
    caseloads: string[],
    userRoles: string[],
    username: string,
  ): Promise<SentenceAndOffenceViewModel> {
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, username, caseloads, userRoles)

    const [sentencesAndOffences, adjustmentDetails, ersedAvailable, analysedAdjustments, validationResult] =
      await Promise.all([
        this.calculateReleaseDatesService.getActiveAnalysedSentencesAndOffences(prisonerDetail.bookingId, username),
        this.calculateReleaseDatesService.getBookingAndSentenceAdjustments(prisonerDetail.bookingId, username),
        this.calculateReleaseDatesService.getErsedEligibility(prisonerDetail.bookingId, username),
        config.featureToggles.adjustmentsIntegrationEnabled
          ? this.calculateReleaseDatesService.getAdjustmentsForPrisoner(prisonerDetail.offenderNo, username)
          : Promise.resolve([]),
        this.calculateReleaseDatesService.validateBackend(nomsId, userInputs, username),
      ])

    const returnToCustody = sentencesAndOffences.filter(s => SentenceTypes.isSentenceFixedTermRecall(s)).length
      ? await this.prisonerService.getReturnToCustodyDate(prisonerDetail.bookingId, username).catch(error => {
          if (error.status === 404) {
            // RTC date not entered for a FTR but this will be flagged by validation so don't blow up
            return null
          }
          throw error
        })
      : null

    let validationMessages: ErrorMessages
    const unsupportedMessages = validationResult.filter(error => error.calculationUnsupported)
    const isUnsupported = Array.isArray(unsupportedMessages) && unsupportedMessages.length > 0
    if (isUnsupported) {
      // we only want to show invalid data errors relevant to manual entry on check-information as the unsupported errors are shown on manual-entry
      validationMessages = await this.calculateReleaseDatesService.validateBookingForManualEntry(nomsId, username)
    } else if (validationResult.length) {
      validationMessages = convertValidationToErrorMessages(
        // hide CONCURRENT_CONSECUTIVE as they will be redirected to the dedicated intercept page on submission
        validationResult.filter(e => e.type !== 'CONCURRENT_CONSECUTIVE'),
      )
    } else {
      validationMessages = { messages: [] }
    }

    return new SentenceAndOffenceViewModel(
      prisonerDetail,
      userInputs,
      sentencesAndOffences,
      adjustmentDetails,
      false,
      ersedAvailable.isValid,
      isUnsupported,
      returnToCustody,
      validationMessages,
      analysedAdjustments,
    )
  }
}

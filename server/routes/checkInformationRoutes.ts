import { RequestHandler } from 'express'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import PrisonerService from '../services/prisonerService'
import EntryPointService from '../services/entryPointService'
import SentenceAndOffenceViewModel from '../models/SentenceAndOffenceViewModel'
import { ErrorMessages, ErrorMessageType } from '../types/ErrorMessages'

export default class CheckInformationRoutes {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
    private readonly entryPointService: EntryPointService
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

    let validationMessages: ErrorMessages
    const validationFlash = req.flash('validation')
    if (req.query.hasErrors) {
      validationMessages = await this.calculateReleaseDatesService.validateBackend(nomsId, sentencesAndOffences, token)
    } else if (validationFlash.length) {
      validationMessages = JSON.parse(validationFlash[0])
    } else {
      validationMessages = null
    }

    res.render('pages/calculation/checkInformation', {
      ...SentenceAndOffenceViewModel.from(prisonerDetail, sentencesAndOffences, adjustmentDetails),
      dpsEntryPoint: this.entryPointService.isDpsEntryPoint(req),
      validationErrors: validationMessages,
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
    const errors = await this.calculateReleaseDatesService.validateBackend(nomsId, sentencesAndOffences, token)
    if (errors.messages.length > 0) {
      return res.redirect(`/calculation/${nomsId}/check-information?hasErrors=true`)
    }

    try {
      const releaseDates = await this.calculateReleaseDatesService.calculatePreliminaryReleaseDates(
        username,
        nomsId,
        token
      )
      return res.redirect(`/calculation/${nomsId}/summary/${releaseDates.calculationRequestId}`)
    } catch (e) {
      if (e.status === 422 && e.data?.errorCode === 'REMAND_OVERLAPS_WITH_SENTENCE') {
        req.flash(
          'validation',
          JSON.stringify({
            messages: [{ text: 'Remand time cannot be credited when a custodial sentence is being served.' }],
            messageType: ErrorMessageType.VALIDATION,
          } as ErrorMessages)
        )
        return res.redirect(`/calculation/${nomsId}/check-information`)
      }
      throw e
    }
  }
}

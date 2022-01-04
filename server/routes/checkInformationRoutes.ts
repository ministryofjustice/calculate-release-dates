import { RequestHandler } from 'express'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import PrisonerService from '../services/prisonerService'
import { groupBy, indexBy } from '../utils/utils'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'
import EntryPointService from '../services/entryPointService'

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
    const adjustmentDetails = await this.prisonerService.getSentenceAdjustments(
      username,
      prisonerDetail.bookingId,
      token
    )

    res.render('pages/calculation/checkInformation', {
      prisonerDetail,
      sentencesAndOffences,
      adjustmentDetails,
      caseToSentences: groupBy(sentencesAndOffences, (sent: PrisonApiOffenderSentenceAndOffences) => sent.caseSequence),
      sentenceSequenceToSentence: indexBy(
        sentencesAndOffences,
        (sent: PrisonApiOffenderSentenceAndOffences) => sent.sentenceSequence
      ),
      dpsEntryPoint: this.entryPointService.isDpsEntryPoint(req),
      validationErrors:
        req.query.hasErrors && this.calculateReleaseDatesService.validateNomisInformation(sentencesAndOffences),
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
    const errors = this.calculateReleaseDatesService.validateNomisInformation(sentencesAndOffences)
    if (errors.messages.length > 0) {
      return res.redirect(`/calculation/${nomsId}/check-information?hasErrors=true`)
    }

    const releaseDates = await this.calculateReleaseDatesService.calculatePreliminaryReleaseDates(
      username,
      nomsId,
      token
    )
    return res.redirect(`/calculation/${nomsId}/summary/${releaseDates.calculationRequestId}`)
  }
}

import { RequestHandler } from 'express'
import PrisonerService from '../services/prisonerService'
import SentenceAndOffenceViewModel from '../models/SentenceAndOffenceViewModel'
import ViewReleaseDatesService from '../services/viewReleaseDatesService'

export default class ViewRoutes {
  constructor(
    private readonly viewReleaseDatesService: ViewReleaseDatesService,
    private readonly prisonerService: PrisonerService
  ) {}

  public startViewJourney: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    const latestCalculation = await this.viewReleaseDatesService.getLatestCalculation(
      nomsId,
      prisonerDetail.bookingId,
      token
    )
    res.redirect(`/view/${latestCalculation.calculationRequestId}/sentences-and-offences`)
  }

  public sentencesAndOffences: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const calculationRequestId = Number(req.params.calculationRequestId)
    try {
      const prisonerDetail = await this.viewReleaseDatesService.getPrisonerDetail(
        calculationRequestId,
        caseloads,
        token
      )
      const sentencesAndOffences = await this.viewReleaseDatesService.getSentencesAndOffences(
        calculationRequestId,
        token
      )
      const adjustmentDetails = await this.viewReleaseDatesService.getBookingAndSentenceAdjustments(
        calculationRequestId,
        token
      )

      res.render('pages/view/sentencesAndOffences', {
        ...SentenceAndOffenceViewModel.from(prisonerDetail, sentencesAndOffences, adjustmentDetails),
        calculationRequestId,
      })
    } catch (error) {
      if (error.status === 404 && error.data?.errorCode === 'PRISON_API_DATA_MISSING') {
        res.redirect(`/view/${calculationRequestId}/calculation-summary`)
      } else {
        throw error
      }
    }
  }
}

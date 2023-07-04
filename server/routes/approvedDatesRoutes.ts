import { RequestHandler } from 'express'
import PrisonerService from '../services/prisonerService'

export default class ApprovedDatesRoutes {
  constructor(private readonly prisonerService: PrisonerService) {}

  public selectedApprovedDates: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId, calculationRequestId } = req.params
    if (!req.session.selectedApprovedDates) {
      req.session.selectedApprovedDates = {}
    }
    req.session.selectedApprovedDates[nomsId] = []
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    return res.render('pages/approvedDates/selectApprovedDates', { prisonerDetail, calculationRequestId })
  }
}

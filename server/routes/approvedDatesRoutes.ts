import { RequestHandler } from 'express'
import PrisonerService from '../services/prisonerService'
import ApprovedDatesService from '../services/approvedDatesService'

export default class ApprovedDatesRoutes {
  constructor(
    private readonly prisonerService: PrisonerService,
    private readonly approvedDatesService: ApprovedDatesService
  ) {}

  public askApprovedDatesQuestion: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId, calculationRequestId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    return res.render('pages/approvedDates/approvedDatesQuestion', { prisonerDetail, calculationRequestId })
  }

  public submitApprovedDatesQuestion: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId, calculationRequestId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    const hasApprovedDates = req.body.approvedDatesQuestion
    if (hasApprovedDates === 'yes') {
      return res.redirect(`/calculation/${nomsId}/${calculationRequestId}/select-approved-dates`)
    }
    if (hasApprovedDates === 'no') {
      return res.redirect(`/calculation/${nomsId}/${calculationRequestId}/store`)
    }
    const error = !hasApprovedDates
    return res.render('pages/approvedDates/approvedDatesQuestion', { prisonerDetail, calculationRequestId, error })
  }

  public selectedApprovedDateTypes: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId, calculationRequestId } = req.params
    if (!req.session.selectedApprovedDates) {
      req.session.selectedApprovedDates = {}
    }
    if (!req.session.selectedApprovedDates[nomsId]) {
      req.session.selectedApprovedDates[nomsId] = []
    }
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    const config = this.approvedDatesService.getConfig(req)
    return res.render('pages/approvedDates/selectApprovedDates', { prisonerDetail, calculationRequestId, config })
  }

  public submitApprovedDateTypes: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId, calculationRequestId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    const { error, config } = this.approvedDatesService.submitApprovedDateTypes(req)
    if (error) {
      return res.render('pages/approvedDates/selectApprovedDates', {
        prisonerDetail,
        calculationRequestId,
        config,
        error,
      })
    }
    return res.redirect(`/calculation/${nomsId}/${calculationRequestId}/submit-dates`)
  }

  public loadSubmitDates: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId, calculationRequestId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    return res.render('pages/approvedDates/submitDate', { prisonerDetail, calculationRequestId })
  }
}

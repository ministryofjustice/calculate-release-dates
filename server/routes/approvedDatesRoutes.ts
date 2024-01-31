import { RequestHandler } from 'express'
import { DateTime } from 'luxon'
import PrisonerService from '../services/prisonerService'
import ApprovedDatesService from '../services/approvedDatesService'
import ManualEntryService from '../services/manualEntryService'
import { EnteredDate } from '../services/dateValidationService'
import { ManualEntryDate, SubmittedDate } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

export default class ApprovedDatesRoutes {
  constructor(
    private readonly prisonerService: PrisonerService,
    private readonly approvedDatesService: ApprovedDatesService,
    private readonly manualEntryService: ManualEntryService,
  ) {
    // intentionally left blank
  }

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
    if (!req.session.selectedApprovedDates) {
      req.session.selectedApprovedDates = {}
    }
    if (!req.session.selectedApprovedDates[nomsId]) {
      req.session.selectedApprovedDates[nomsId] = []
    }
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
    const { year, month, day } = req.query
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    if (req.session.selectedApprovedDates[nomsId].length === 0) {
      return res.redirect(`/calculation/${nomsId}/${calculationRequestId}/select-dates`)
    }
    let previousDate
    if (year && month && day) {
      previousDate = { year, month, day } as SubmittedDate
    }
    let hdced
    if (req.session.HDCED[nomsId]) {
      hdced = DateTime.fromFormat(req.session.HDCED[nomsId], 'yyyy-M-d').toFormat('cccc, dd LLLL yyyy')
    }
    let hdcedWeekendAdjusted
    if (req.session.HDCED[nomsId]) {
      hdcedWeekendAdjusted = req.session.HDCED_WEEKEND_ADJUSTED[nomsId]
    }
    const date = this.manualEntryService.getNextDateToEnter(req.session.selectedApprovedDates[nomsId])
    if (date) {
      return res.render('pages/approvedDates/submitDate', {
        prisonerDetail,
        date,
        previousDate,
        calculationRequestId,
        hdced,
        hdcedWeekendAdjusted,
      })
    }
    return res.redirect(`/calculation/${nomsId}/${calculationRequestId}/confirmation`)
  }

  public storeSubmitDates: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId, calculationRequestId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    const dateValue: EnteredDate = req.body
    const storeDateResponse = this.manualEntryService.storeDate(req.session.selectedApprovedDates[nomsId], dateValue)
    if (!storeDateResponse.success && storeDateResponse.message) {
      const { date, message, enteredDate } = storeDateResponse
      const error = message
      return res.render('pages/approvedDates/submitDate', { prisonerDetail, date, error, enteredDate })
    }
    if (storeDateResponse.success && !storeDateResponse.message) {
      req.session.selectedApprovedDates[nomsId].find(
        (d: ManualEntryDate) => d.dateType === storeDateResponse.date.dateType,
      ).date = storeDateResponse.date.date
      return res.redirect(`/calculation/${nomsId}/${calculationRequestId}/submit-dates`)
    }
    return res.redirect(`/calculation/${nomsId}/${calculationRequestId}/confirmation`)
  }

  public loadChangeDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, calculationRequestId } = req.params
    const { date } = this.approvedDatesService.changeDate(req, nomsId)
    return res.redirect(
      `/calculation/${nomsId}/${calculationRequestId}/submit-dates?year=${date.year}&month=${date.month}&day=${date.day}`,
    )
  }

  public loadRemoveDate: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId, calculationRequestId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    const dateToRemove: string = <string>req.query.dateType
    if (req.session.selectedApprovedDates[nomsId].some((d: ManualEntryDate) => d.dateType === dateToRemove)) {
      const fullDateName = this.manualEntryService.fullStringLookup(dateToRemove)
      return res.render('pages/approvedDates/removeDate', { prisonerDetail, dateToRemove, fullDateName })
    }
    return res.redirect(`/calculation/${nomsId}/${calculationRequestId}/confirmation`)
  }

  public submitRemoveDate: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId, calculationRequestId } = req.params
    const dateToRemove: string = <string>req.query.dateType
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    const fullDateName = this.manualEntryService.fullStringLookup(dateToRemove)
    if (req.body['remove-date'] !== 'yes' && req.body['remove-date'] !== 'no') {
      const error = true
      return res.render('pages/approvedDates/removeDate', { prisonerDetail, dateToRemove, fullDateName, error })
    }
    this.approvedDatesService.removeDate(req, nomsId)
    return res.redirect(`/calculation/${nomsId}/${calculationRequestId}/confirmation`)
  }
}

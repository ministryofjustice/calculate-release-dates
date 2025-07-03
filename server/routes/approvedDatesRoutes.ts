import { RequestHandler } from 'express'
import { DateTime } from 'luxon'
import PrisonerService from '../services/prisonerService'
import ApprovedDatesService from '../services/approvedDatesService'
import ManualEntryService from '../services/manualEntryService'
import { EnteredDate } from '../services/dateValidationService'
import {
  ManualEntrySelectedDate,
  SubmittedDate,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ApprovedDatesQuestionViewModel from '../models/ApprovedDatesQuestionViewModel'
import RemoveApprovedDateViewModel from '../models/RemoveApprovedDateViewModel'
import SelectApprovedDatesViewModel from '../models/SelectApprovedDatesViewModel'
import ApprovedDatesSubmitDateViewModel from '../models/ApprovedDatesSubmitDateViewModel'

export default class ApprovedDatesRoutes {
  constructor(
    private readonly prisonerService: PrisonerService,
    private readonly approvedDatesService: ApprovedDatesService,
    private readonly manualEntryService: ManualEntryService,
  ) {
    // intentionally left blank
  }

  public askApprovedDatesQuestion: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, userRoles } = res.locals.user
    const { nomsId, calculationRequestId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, token, caseloads, userRoles)
    return res.render(
      'pages/approvedDates/approvedDatesQuestion',
      new ApprovedDatesQuestionViewModel(prisonerDetail, calculationRequestId, req.originalUrl),
    )
  }

  public submitApprovedDatesQuestion: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, userRoles } = res.locals.user
    const { nomsId, calculationRequestId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, token, caseloads, userRoles)
    const hasApprovedDates = req.body.approvedDatesQuestion
    if (hasApprovedDates === 'yes') {
      return res.redirect(`/calculation/${nomsId}/${calculationRequestId}/select-approved-dates`)
    }
    if (hasApprovedDates === 'no') {
      return res.redirect(`/calculation/${nomsId}/${calculationRequestId}/store`)
    }
    const error = !hasApprovedDates
    return res.render(
      'pages/approvedDates/approvedDatesQuestion',
      new ApprovedDatesQuestionViewModel(prisonerDetail, calculationRequestId, req.originalUrl, error),
    )
  }

  public selectApprovedDateTypes: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, userRoles } = res.locals.user
    const { nomsId, calculationRequestId } = req.params
    if (!req.session.selectedApprovedDates) {
      req.session.selectedApprovedDates = {}
    }
    if (!req.session.selectedApprovedDates[nomsId]) {
      req.session.selectedApprovedDates[nomsId] = []
    }
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, token, caseloads, userRoles)
    const config = await this.approvedDatesService.getConfig(token, req)
    return res.render(
      'pages/approvedDates/selectApprovedDates',
      new SelectApprovedDatesViewModel(
        prisonerDetail,
        calculationRequestId,
        config,
        req.session.isAddDatesFlow,
        req.originalUrl,
      ),
    )
  }

  public submitApprovedDateTypes: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, userRoles } = res.locals.user
    const { nomsId, calculationRequestId } = req.params
    if (!req.session.selectedApprovedDates) {
      req.session.selectedApprovedDates = {}
    }
    if (!req.session.selectedApprovedDates[nomsId]) {
      req.session.selectedApprovedDates[nomsId] = []
    }
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, token, caseloads, userRoles)
    const { error, config } = await this.approvedDatesService.submitApprovedDateTypes(token, req)
    if (error) {
      return res.render(
        'pages/approvedDates/selectApprovedDates',
        new SelectApprovedDatesViewModel(prisonerDetail, calculationRequestId, config, false, req.originalUrl, error),
      )
    }
    return res.redirect(`/calculation/${nomsId}/${calculationRequestId}/submit-dates`)
  }

  public loadSubmitDates: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, userRoles } = res.locals.user
    const { nomsId, calculationRequestId } = req.params
    const { year, month, day } = req.query
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, token, caseloads, userRoles)
    if (!req.session.selectedApprovedDates[nomsId]?.length) {
      return res.redirect(`/calculation/${nomsId}/${calculationRequestId}/select-dates`)
    }
    let previousDate
    if (year && month && day) {
      previousDate = { year, month, day } as unknown as SubmittedDate
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
      return res.render(
        'pages/approvedDates/submitDate',
        new ApprovedDatesSubmitDateViewModel(
          prisonerDetail,
          date,
          previousDate,
          calculationRequestId,
          hdced,
          hdcedWeekendAdjusted,
          req.originalUrl,
        ),
      )
    }
    return res.redirect(`/calculation/${nomsId}/${calculationRequestId}/confirmation`)
  }

  public storeSubmitDates: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, userRoles } = res.locals.user
    const { nomsId, calculationRequestId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, token, caseloads, userRoles)
    const dateValue: EnteredDate = req.body
    const storeDateResponse = this.manualEntryService.storeDate(req.session.selectedApprovedDates[nomsId], dateValue)
    if (!storeDateResponse.success && storeDateResponse.message) {
      const { date, message, enteredDate } = storeDateResponse
      return res.render(
        'pages/approvedDates/submitDate',
        new ApprovedDatesSubmitDateViewModel(
          prisonerDetail,
          date,
          undefined,
          undefined,
          undefined,
          undefined,
          req.originalUrl,
          message,
          enteredDate,
        ),
      )
    }
    if (storeDateResponse.success && !storeDateResponse.message) {
      req.session.selectedApprovedDates[nomsId].find(
        (d: ManualEntrySelectedDate) => d.dateType === storeDateResponse.date.dateType,
      ).date = storeDateResponse.date.date
      return res.redirect(`/calculation/${nomsId}/${calculationRequestId}/submit-dates`)
    }
    return res.redirect(`/calculation/${nomsId}/${calculationRequestId}/confirmation`)
  }

  public loadChangeDate: RequestHandler = async (req, res): Promise<void> => {
    const { token } = res.locals.user
    const { nomsId, calculationRequestId } = req.params
    const { date } = await this.approvedDatesService.changeDate(token, req, nomsId)
    return res.redirect(
      `/calculation/${nomsId}/${calculationRequestId}/submit-dates?year=${date.year}&month=${date.month}&day=${date.day}`,
    )
  }

  public loadRemoveDate: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, userRoles } = res.locals.user
    const { nomsId, calculationRequestId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, token, caseloads, userRoles)
    const dateToRemove: string = <string>req.query.dateType
    if (this.approvedDatesService.hasApprovedDateToRemove(req, nomsId, dateToRemove)) {
      const fullDateName = await this.manualEntryService.fullStringLookup(token, dateToRemove)
      return res.render(
        'pages/approvedDates/removeDate',
        new RemoveApprovedDateViewModel(prisonerDetail, dateToRemove, fullDateName, req.originalUrl),
      )
    }
    return res.redirect(`/calculation/${nomsId}/${calculationRequestId}/confirmation`)
  }

  public submitRemoveDate: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, userRoles } = res.locals.user
    const { nomsId, calculationRequestId } = req.params
    const dateToRemove: string = <string>req.query.dateType
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, token, caseloads, userRoles)
    const fullDateName = await this.manualEntryService.fullStringLookup(token, dateToRemove)
    if (req.body['remove-date'] !== 'yes' && req.body['remove-date'] !== 'no') {
      return res.render(
        'pages/approvedDates/removeDate',
        new RemoveApprovedDateViewModel(prisonerDetail, dateToRemove, fullDateName, req.originalUrl, true),
      )
    }
    this.approvedDatesService.removeDate(req, nomsId)
    return res.redirect(`/calculation/${nomsId}/${calculationRequestId}/confirmation`)
  }
}

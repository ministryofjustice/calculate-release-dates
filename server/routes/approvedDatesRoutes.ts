import { RequestHandler } from 'express'
import { DateTime } from 'luxon'
import PrisonerService from '../services/prisonerService'
import ApprovedDatesService from '../services/approvedDatesService'
import ManualEntryService from '../services/manualEntryService'
import { EnteredDate } from '../services/dateValidationService'
import ApprovedDatesQuestionViewModel from '../models/ApprovedDatesQuestionViewModel'
import RemoveApprovedDateViewModel from '../models/RemoveApprovedDateViewModel'
import SelectApprovedDatesViewModel from '../models/SelectApprovedDatesViewModel'
import ApprovedDatesSubmitDateViewModel from '../models/ApprovedDatesSubmitDateViewModel'
import { ManualEntrySelectedDate, ManualJourneySelectedDate } from '../types/ManualJourney'
import { saveCalculation } from './saveCalculationHelper'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'

export default class ApprovedDatesRoutes {
  constructor(
    private readonly prisonerService: PrisonerService,
    private readonly approvedDatesService: ApprovedDatesService,
    private readonly manualEntryService: ManualEntryService,
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
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
      return saveCalculation(
        req,
        res,
        this.calculateReleaseDatesService,
        `/calculation/${nomsId}/summary/${calculationRequestId}`,
      )
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

    const firstDateType = req.session.selectedApprovedDates[nomsId].find(
      (d: ManualJourneySelectedDate) => d.position === 1,
    )

    let redirectUrl = `/calculation/${nomsId}/${calculationRequestId}/submit-dates`

    if (firstDateType && firstDateType?.dateType) {
      redirectUrl += `?dateType=${firstDateType.dateType}`
    }

    return res.redirect(redirectUrl)
  }

  public loadSubmitDates: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, userRoles } = res.locals.user
    const { nomsId, calculationRequestId } = req.params as Record<string, string>
    const { dateType } = req.query as Record<string, string>

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, token, caseloads, userRoles)
    const approvedDates = req.session.selectedApprovedDates[nomsId]

    if (approvedDates.length === 0) {
      return res.redirect(`/calculation/${nomsId}/${calculationRequestId}/select-approved-dates`)
    }

    const nextDate =
      (typeof dateType === 'string' && this.manualEntryService.getDateByType(approvedDates, dateType)) ||
      this.manualEntryService.getNextDateToEnter(approvedDates, dateType)

    let hdced
    if (req.session.HDCED[nomsId]) {
      hdced = DateTime.fromFormat(req.session.HDCED[nomsId], 'yyyy-M-d').toFormat('cccc, dd LLLL yyyy')
    }
    let hdcedWeekendAdjusted
    if (req.session.HDCED[nomsId]) {
      hdcedWeekendAdjusted = req.session.HDCED_WEEKEND_ADJUSTED[nomsId]
    }

    if (nextDate) {
      const previousDate = this.manualEntryService.getPreviousDate(req.session.selectedApprovedDates[nomsId], nextDate)
      const backLink = this.getSubmitDatesBackLink(req, nomsId, calculationRequestId, previousDate)
      return res.render(
        'pages/approvedDates/submitDate',
        new ApprovedDatesSubmitDateViewModel(
          prisonerDetail,
          backLink,
          nextDate.manualEntrySelectedDate,
          nextDate?.manualEntrySelectedDate.date,
          calculationRequestId,
          hdced,
          hdcedWeekendAdjusted,
          req.originalUrl,
        ),
      )
    }

    req.session.selectedManualEntryDates[nomsId] = req.session.selectedApprovedDates[nomsId].map(
      (d: ManualJourneySelectedDate) => ({
        ...d,
        completed: true,
      }),
    )

    return res.redirect(`/calculation/${nomsId}/${calculationRequestId}/confirmation`)
  }

  public storeSubmitDates: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, userRoles } = res.locals.user
    const { nomsId, calculationRequestId } = req.params
    const { dateType } = req.query as Record<string, string>

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, token, caseloads, userRoles)
    const dateValue: EnteredDate = req.body
    const storeDateResponse = this.manualEntryService.storeDate(req.session.selectedApprovedDates[nomsId], dateValue)
    const approvedDates: ManualJourneySelectedDate[] = req.session.selectedApprovedDates[nomsId]

    if (!storeDateResponse.success && storeDateResponse.message) {
      const { date, message, enteredDate } = storeDateResponse
      const nextDate =
        (typeof dateType === 'string' && this.manualEntryService.getDateByType(approvedDates, dateType)) ||
        this.manualEntryService.getNextDateToEnter(approvedDates)
      const previousDate = this.manualEntryService.getPreviousDate(req.session.selectedApprovedDates[nomsId], nextDate)
      const backLink = this.getSubmitDatesBackLink(req, nomsId, calculationRequestId, previousDate)
      return res.render(
        'pages/approvedDates/submitDate',
        new ApprovedDatesSubmitDateViewModel(
          prisonerDetail,
          backLink,
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
      const currentDate = req.session.selectedApprovedDates[nomsId].find(
        (d: ManualEntrySelectedDate) => d.dateType === storeDateResponse.date.dateType,
      )

      currentDate.date = storeDateResponse.date.date

      const nextDate = this.manualEntryService.getNextDateToEnter(approvedDates, currentDate.dateType)

      if (nextDate) {
        const hasApprovedDates = approvedDates && approvedDates.length > 0
        const queryString = hasApprovedDates ? `?dateType=${nextDate.dateType}` : ''

        return res.redirect(`/calculation/${nomsId}/${calculationRequestId}/submit-dates${queryString}`)
      }
    }

    req.session.selectedApprovedDates[nomsId] = approvedDates.map((d: ManualJourneySelectedDate) => ({
      ...d,
      completed: true,
    }))

    return res.redirect(`/calculation/${nomsId}/${calculationRequestId}/confirmation`)
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

  private getSubmitDatesBackLink(req, nomsId: string, requestId: string, previousDate?: ManualEntrySelectedDate) {
    const numberOfDates = req.session.selectedApprovedDates[nomsId].filter(
      (d: ManualJourneySelectedDate) => d.completed === false,
    ).length

    if (!previousDate && numberOfDates) {
      return `/calculation/${nomsId}/${requestId}/select-approved-dates`
    }

    if (previousDate) {
      return `/calculation/${nomsId}/${requestId}/submit-dates?dateType=${previousDate.dateType}`
    }

    return `/calculation/${nomsId}/${requestId}/confirmation`
  }
}

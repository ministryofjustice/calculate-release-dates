import { Request, RequestHandler } from 'express'
import PrisonerService from '../services/prisonerService'
import ApprovedDatesService from '../services/approvedDatesService'
import { ManualEntrySelectedDate, SubmittedDate } from '../models/ManualEntrySelectedDate'
import ManualEntryService from '../services/manualEntryService'
import DateValidationService, {
  DateInputItem,
  EnteredDate,
  StorageResponseModel,
} from '../services/dateValidationService'

export default class ApprovedDatesRoutes {
  constructor(
    private readonly prisonerService: PrisonerService,
    private readonly approvedDatesService: ApprovedDatesService,
    private readonly manualEntryService: ManualEntryService,
    private readonly dateValidationService: DateValidationService
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
    const date = this.manualEntryService.getNextDateToEnter(req.session.selectedApprovedDates[nomsId])
    if (date) {
      return res.render('pages/approvedDates/submitDate', { prisonerDetail, date, previousDate, calculationRequestId })
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
        (d: ManualEntrySelectedDate) => d.dateType === storeDateResponse.date.dateType
      ).date = storeDateResponse.date.date
      return res.redirect(`/calculation/${nomsId}/${calculationRequestId}/submit-dates`)
    }
    return res.redirect(`/calculation/${nomsId}/${calculationRequestId}/confirmation`)
  }

  private storeSubmittedDate(req: Request, enteredDate: EnteredDate, nomsId: string) {
    const allItems: DateInputItem[] = [
      {
        classes: 'govuk-input--width-2',
        name: 'day',
        value: enteredDate.day,
      } as DateInputItem,
      {
        classes: 'govuk-input--width-2',
        name: 'month',
        value: enteredDate.month,
      },
      {
        classes: 'govuk-input--width-4',
        name: 'year',
        value: enteredDate.year,
      },
    ]
    if (enteredDate.day === '' && enteredDate.month === '' && enteredDate.year === '') {
      const message = 'The date entered must include a day, month and a year.'
      return this.dateValidationService.allErrored(
        req.session.selectedApprovedDates[nomsId],
        enteredDate,
        allItems,
        message
      )
    }
    const someErrors = this.dateValidationService.singleItemsErrored(
      req.session.selectedApprovedDates[nomsId],
      allItems,
      enteredDate
    )
    if (someErrors) {
      return someErrors
    }
    if (!this.dateValidationService.isDateValid(enteredDate)) {
      return this.dateValidationService.allErrored(
        req.session.selectedApprovedDates[nomsId],
        enteredDate,
        allItems,
        'The date entered must be a real date'
      )
    }
    const notWithinOneHundredYears = this.dateValidationService.notWithinOneHundredYears(
      req.session.selectedApprovedDates[nomsId],
      enteredDate,
      allItems
    )
    if (notWithinOneHundredYears) {
      return notWithinOneHundredYears
    }
    req.session.selectedApprovedDates[nomsId].find(
      (d: ManualEntrySelectedDate) => d.dateType === enteredDate.dateType
    ).date = enteredDate
    return { success: true, isNone: false } as StorageResponseModel
  }
}

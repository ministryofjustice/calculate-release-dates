import { RequestHandler } from 'express'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import PrisonerService from '../services/prisonerService'
import ManualCalculationService from '../services/manualCalculationService'
import ManualEntryService from '../services/manualEntryService'
import { getManualEntrySnapshot, clearRoutingFlag, statusOf, RequestWithSession } from './manualEntryHelpers'
import logger from '../../logger'
import { ErrorMessages, ErrorMessageType } from '../types/ErrorMessages'
import {
  ManualEntrySelectedDate,
  SubmittedDate,
  ValidationMessage,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ManualEntryConfirmationViewModel from '../models/manual_calculation/ManualEntryConfirmationViewModel'
import ManualEntryDateEntryViewModel from '../models/manual_calculation/ManualEntryDateEntryViewModel'
import ManualEntrySelectDatesViewModel from '../models/manual_calculation/ManualEntrySelectDatesViewModel'
import ManualEntryLandingPageViewModel from '../models/manual_calculation/ManualEntryLandingPageViewModel'
import ManualEntryNoDatesConfirmationViewModel from '../models/manual_calculation/ManualEntryNoDatesConfirmationViewModel'
import ManualEntryRemoteDateViewModel from '../models/manual_calculation/ManualEntryRemoteDateViewModel'

export default class ManualEntryRoutes {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
    private readonly manualCalculationService: ManualCalculationService,
    private readonly manualEntryService: ManualEntryService,
  ) {
    // intentionally left blank
  }

  public landingPage: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, userRoles } = res.locals.user
    const { nomsId } = req.params

    const unsupportedSentenceOrCalculationMessages =
      await this.calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessagesWithType(nomsId, token)

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, token, caseloads, userRoles)

    const redirect = await this.validateUseOfManualCalculationJourneyOrRedirect(
      nomsId,
      token,
      prisonerDetail.bookingId,
      req,
    )
    if (redirect) {
      return res.redirect(redirect)
    }

    if (!req.session.selectedManualEntryDates) {
      req.session.selectedManualEntryDates = {}
    }
    req.session.selectedManualEntryDates[nomsId] = []

    const hasIndeterminateSentences = await this.manualCalculationService.hasIndeterminateSentences(
      prisonerDetail.bookingId,
      token,
    )

    return res.render(
      'pages/manualEntry/manualEntry',
      new ManualEntryLandingPageViewModel(prisonerDetail, hasIndeterminateSentences, req.originalUrl, {
        unsupportedSentenceMessages: unsupportedSentenceOrCalculationMessages.unsupportedSentenceMessages,
        unsupportedCalculationMessages: unsupportedSentenceOrCalculationMessages.unsupportedCalculationMessages,
        unsupportedManualMessages: unsupportedSentenceOrCalculationMessages.unsupportedManualMessages,
      }),
    )
  }

  private async validateUseOfManualCalculationJourneyOrRedirect(
    nomsId: string,
    token: string,
    bookingId: number,
    req: RequestWithSession,
    validationMessages?: ValidationMessage[],
  ): Promise<string | null> {
    const routingFlags: string[] = req.session.manualEntryRoutingForBookings ?? []

    if (!routingFlags.includes(nomsId)) {
      const unsupportedSentenceOrCalculationMessages =
        validationMessages ??
        (await this.calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages(nomsId, token)) ??
        []

      const hasRecallSentences = await this.manualCalculationService.hasRecallSentences(bookingId, token)

      if (unsupportedSentenceOrCalculationMessages.length === 0 && !hasRecallSentences) {
        return `/calculation/${nomsId}/check-information`
      }
    }

    return null
  }

  public submitSelectedDates: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, userRoles } = res.locals.user
    const { nomsId } = req.params

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, token, caseloads, userRoles)

    const redirect = await this.validateUseOfManualCalculationJourneyOrRedirect(
      nomsId,
      token,
      prisonerDetail.bookingId,
      req,
    )
    if (redirect) {
      return res.redirect(redirect)
    }

    if (!req.session.selectedManualEntryDates) {
      req.session.selectedManualEntryDates = {}
    }
    const hasIndeterminateSentences = await this.manualCalculationService.hasIndeterminateSentences(
      prisonerDetail.bookingId,
      token,
    )

    const { error, config } = await this.manualEntryService.verifySelectedDateType(
      token,
      req,
      nomsId,
      hasIndeterminateSentences,
      false,
    )
    if (error) {
      const insufficientDatesSelected = true
      return res.render(
        'pages/manualEntry/dateTypeSelection',
        new ManualEntrySelectDatesViewModel(prisonerDetail, config, req.originalUrl, insufficientDatesSelected),
      )
    }
    await this.manualEntryService.addManuallyCalculatedDateTypes(token, req, nomsId)
    return res.redirect(`/calculation/${nomsId}/manual-entry/enter-date`)
  }

  public dateSelection: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, userRoles } = res.locals.user
    const { nomsId } = req.params

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, token, caseloads, userRoles)

    const redirect = await this.validateUseOfManualCalculationJourneyOrRedirect(
      nomsId,
      token,
      prisonerDetail.bookingId,
      req,
    )
    if (redirect) {
      return res.redirect(redirect)
    }

    if (!req.session.selectedManualEntryDates) {
      req.session.selectedManualEntryDates = {}
    }
    const hasIndeterminateSentences = await this.manualCalculationService.hasIndeterminateSentences(
      prisonerDetail.bookingId,
      token,
    )
    const firstLoad = !req.query.addExtra
    const { config } = await this.manualEntryService.verifySelectedDateType(
      token,
      req,
      nomsId,
      hasIndeterminateSentences,
      firstLoad,
    )
    return res.render(
      'pages/manualEntry/dateTypeSelection',
      new ManualEntrySelectDatesViewModel(prisonerDetail, config, req.originalUrl),
    )
  }

  public enterDate: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, userRoles } = res.locals.user
    const { nomsId } = req.params
    const { year, month, day } = req.query

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, token, caseloads, userRoles)

    const redirect = await this.validateUseOfManualCalculationJourneyOrRedirect(
      nomsId,
      token,
      prisonerDetail.bookingId,
      req,
    )
    if (redirect) {
      return res.redirect(redirect)
    }

    if (req.session.selectedManualEntryDates[nomsId].length === 0) {
      return res.redirect(`/calculation/${nomsId}/manual-entry/select-dates`)
    }
    let previousDate
    if (year && month && day) {
      previousDate = { year, month, day } as unknown as SubmittedDate
    }
    const date = this.manualEntryService.getNextDateToEnter(req.session.selectedManualEntryDates[nomsId])
    if (date && date.dateType !== 'None') {
      return res.render(
        'pages/manualEntry/dateEntry',
        new ManualEntryDateEntryViewModel(prisonerDetail, date, previousDate, req.originalUrl),
      )
    }
    if (date && date.dateType === 'None') {
      return res.redirect(`/calculation/${nomsId}/manual-entry/no-dates-confirmation`)
    }
    return res.redirect(`/calculation/${nomsId}/manual-entry/confirmation`)
  }

  public submitDate: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, userRoles } = res.locals.user
    const { nomsId } = req.params

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, token, caseloads, userRoles)

    const redirect = await this.validateUseOfManualCalculationJourneyOrRedirect(
      nomsId,
      token,
      prisonerDetail.bookingId,
      req,
    )
    if (redirect) {
      return res.redirect(redirect)
    }

    const storeDateResponse = this.manualEntryService.storeDate(req.session.selectedManualEntryDates[nomsId], req.body)
    if (!storeDateResponse.success && storeDateResponse.message && !storeDateResponse.isNone) {
      const { date, message, enteredDate } = storeDateResponse
      return res.render(
        'pages/manualEntry/dateEntry',
        new ManualEntryDateEntryViewModel(prisonerDetail, date, undefined, req.originalUrl, message, enteredDate),
      )
    }
    if (storeDateResponse.success && !storeDateResponse.message) {
      req.session.selectedManualEntryDates[nomsId].find(
        (d: ManualEntrySelectedDate) => d.dateType === storeDateResponse.date.dateType,
      ).date = storeDateResponse.date.date
      return res.redirect(`/calculation/${nomsId}/manual-entry/enter-date`)
    }
    if (!storeDateResponse.success && storeDateResponse.isNone) {
      return res.redirect(`/calculation/${nomsId}/manual-entry/confirmation`)
    }
    return res.redirect(`/calculation/${nomsId}/manual-entry/confirmation`)
  }

  public loadConfirmation: RequestHandler = async (req, res) => {
    const { caseloads, token, userRoles } = res.locals.user
    const { nomsId } = req.params

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, token, caseloads, userRoles)

    const redirect = await this.validateUseOfManualCalculationJourneyOrRedirect(
      nomsId,
      token,
      prisonerDetail.bookingId,
      req,
    )
    if (redirect) return res.redirect(redirect)

    const serverErrors = req.flash('serverErrors')
    const validationErrors = serverErrors?.[0] ? JSON.parse(serverErrors[0]) : null

    const rows = await this.manualEntryService.getConfirmationConfiguration(token, req, nomsId)
    const model = new ManualEntryConfirmationViewModel(prisonerDetail, rows, req.originalUrl)

    return res.render('pages/manualEntry/confirmation', {
      ...model,
      validationErrors,
    })
  }

  public loadRemoveDate: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, userRoles } = res.locals.user
    const { nomsId } = req.params

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, token, caseloads, userRoles)

    const redirect = await this.validateUseOfManualCalculationJourneyOrRedirect(
      nomsId,
      token,
      prisonerDetail.bookingId,
      req,
    )
    if (redirect) {
      return res.redirect(redirect)
    }

    const dateToRemove: string = <string>req.query.dateType
    if (
      req.session.selectedManualEntryDates[nomsId].some((d: ManualEntrySelectedDate) => d.dateType === dateToRemove)
    ) {
      const fullDateName = await this.manualEntryService.fullStringLookup(token, dateToRemove)
      return res.render(
        'pages/manualEntry/removeDate',
        new ManualEntryRemoteDateViewModel(prisonerDetail, dateToRemove, fullDateName, req.originalUrl),
      )
    }
    return res.redirect(`/calculation/${nomsId}/manual-entry/confirmation`)
  }

  public submitRemoveDate: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, userRoles } = res.locals.user
    const { nomsId } = req.params

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, token, caseloads, userRoles)

    const redirect = await this.validateUseOfManualCalculationJourneyOrRedirect(
      nomsId,
      token,
      prisonerDetail.bookingId,
      req,
    )
    if (redirect) {
      return res.redirect(redirect)
    }

    const dateToRemove: string = <string>req.query.dateType
    const fullDateName = await this.manualEntryService.fullStringLookup(token, dateToRemove)
    if (req.body == null || (req.body['remove-date'] !== 'yes' && req.body['remove-date'] !== 'no')) {
      return res.render(
        'pages/manualEntry/removeDate',
        new ManualEntryRemoteDateViewModel(prisonerDetail, dateToRemove, fullDateName, req.originalUrl, true),
      )
    }
    const remainingDates = this.manualEntryService.removeDate(req, nomsId)
    if (remainingDates === 0) {
      return res.redirect(`/calculation/${nomsId}/manual-entry/select-dates`)
    }
    return res.redirect(`/calculation/${nomsId}/manual-entry/confirmation`)
  }

  public loadChangeDate: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, userRoles } = res.locals.user
    const { nomsId } = req.params

    if (req.session.calculationReasonId == null) {
      return res.redirect(`/calculation/${nomsId}/reason`)
    }

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, token, caseloads, userRoles)

    const redirect = await this.validateUseOfManualCalculationJourneyOrRedirect(
      nomsId,
      token,
      prisonerDetail.bookingId,
      req,
    )
    if (redirect) {
      return res.redirect(redirect)
    }

    const { date } = await this.manualEntryService.changeDate(token, req, nomsId)
    return res.redirect(
      `/calculation/${nomsId}/manual-entry/enter-date?year=${date.year}&month=${date.month}&day=${date.day}`,
    )
  }

  public save: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, username, userRoles } = res.locals.user
    const { nomsId } = req.params

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, token, caseloads, userRoles)

    if (req.session.calculationReasonId == null) {
      return res.redirect(`/calculation/${nomsId}/reason`)
    }

    const redirect = await this.validateUseOfManualCalculationJourneyOrRedirect(
      nomsId,
      token,
      prisonerDetail.bookingId,
      req,
    )
    if (redirect) return res.redirect(redirect)

    getManualEntrySnapshot(req, nomsId)

    try {
      const response = await this.manualCalculationService.storeManualCalculation(username, nomsId, req, token)

      clearRoutingFlag(req, nomsId)
      const isNone =
        req.session.selectedManualEntryDates[nomsId].length === 1 &&
        req.session.selectedManualEntryDates[nomsId][0].dateType === 'None'

      const baseUrl = `/calculation/${nomsId}/complete/${response.calculationRequestId}`
      const fullUrl = isNone ? `${baseUrl}?noDates=true` : baseUrl

      return res.redirect(fullUrl)
    } catch (error) {
      logger.error(error)
      clearRoutingFlag(req, nomsId)

      const s = statusOf(error)

      if (s === 412) {
        req.flash(
          'serverErrors',
          JSON.stringify({
            messages: [
              {
                text: 'The booking data used for this calculation has changed. Go back to the Check NOMIS Information screen to review the changes.',
                href: `/calculation/${nomsId}/check-information`,
              },
            ],
          } as ErrorMessages),
        )
      } else if (s === 423) {
        req.flash(
          'serverErrors',
          JSON.stringify({
            messages: [
              {
                text: 'This person’s record is locked in NOMIS. If this record is open in NOMIS, close the record then come back to this page.',
              },
            ],
            messageType: ErrorMessageType.LOCKED,
          } as ErrorMessages),
        )
      } else {
        req.flash(
          'serverErrors',
          JSON.stringify({
            messages: [{ text: 'The calculation could not be saved in NOMIS.' }],
            messageType: ErrorMessageType.SAVE_DATES,
          } as ErrorMessages),
        )
      }
      return res.redirect(`/calculation/${nomsId}/manual-entry/confirmation`)
    }
  }

  public noDatesConfirmation: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, userRoles } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, token, caseloads, userRoles)

    const redirect = await this.validateUseOfManualCalculationJourneyOrRedirect(
      nomsId,
      token,
      prisonerDetail.bookingId,
      req,
    )
    if (redirect) {
      return res.redirect(redirect)
    }

    return res.render(
      'pages/manualEntry/noDatesConfirmation',
      new ManualEntryNoDatesConfirmationViewModel(prisonerDetail, req.originalUrl),
    )
  }

  public submitNoDatesConfirmation: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, userRoles } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, token, caseloads, userRoles)

    const redirect = await this.validateUseOfManualCalculationJourneyOrRedirect(
      nomsId,
      token,
      prisonerDetail.bookingId,
      req,
    )
    if (redirect) {
      return res.redirect(redirect)
    }

    if (req.body != null && req.body['no-date-selection'] === 'yes') {
      req.session.selectedManualEntryDates[nomsId] = [
        { dateType: 'None', dateText: 'None of the above dates apply', date: null },
      ]
      return res.redirect(`/calculation/${nomsId}/manual-entry/save`)
    }
    if (req.body != null && req.body['no-date-selection'] === 'no') {
      req.session.selectedManualEntryDates[nomsId] = []
      return res.redirect(`/calculation/${nomsId}/manual-entry/select-dates`)
    }
    const error = true
    return res.render(
      'pages/manualEntry/noDatesConfirmation',
      new ManualEntryNoDatesConfirmationViewModel(prisonerDetail, req.originalUrl, error),
    )
  }
}

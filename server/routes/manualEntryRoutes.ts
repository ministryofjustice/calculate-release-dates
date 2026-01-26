import { Request, RequestHandler } from 'express'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import PrisonerService from '../services/prisonerService'
import ManualCalculationService from '../services/manualCalculationService'
import ManualEntryService from '../services/manualEntryService'
import logger from '../../logger'
import { ErrorMessages, ErrorMessageType } from '../types/ErrorMessages'
import { ValidationMessage } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ManualEntryConfirmationViewModel from '../models/manual_calculation/ManualEntryConfirmationViewModel'
import ManualEntryDateEntryViewModel from '../models/manual_calculation/ManualEntryDateEntryViewModel'
import ManualEntrySelectDatesViewModel from '../models/manual_calculation/ManualEntrySelectDatesViewModel'
import ManualEntryLandingPageViewModel from '../models/manual_calculation/ManualEntryLandingPageViewModel'
import ManualEntryNoDatesConfirmationViewModel from '../models/manual_calculation/ManualEntryNoDatesConfirmationViewModel'
import ManualEntryRemoteDateViewModel from '../models/manual_calculation/ManualEntryRemoteDateViewModel'
import CalculateReleaseDatesApiClient from '../data/calculateReleaseDatesApiClient'
import { ManualEntrySelectedDate, ManualJourneySelectedDate } from '../types/ManualJourney'

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
    const { caseloads, token, userRoles, username } = res.locals.user
    const { nomsId } = req.params

    if (req.session.calculationReasonId == null) {
      return res.redirect(`/calculation/${nomsId}/reason`)
    }

    const unsupportedSentenceOrCalculationMessages =
      await this.calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessagesWithType(nomsId, token)

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, username, caseloads, userRoles)
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

    const existingManualJourney = await this.calculateReleaseDatesService.offenderHasPreviousManualCalculation(
      nomsId,
      token,
    )

    if (existingManualJourney && !this.existingDatesInSession(req, nomsId)) {
      if (req.session.selectedManualEntryDates == null) req.session.selectedManualEntryDates = {}
      const crdAPIClient = new CalculateReleaseDatesApiClient(token)
      const latestCalculation = await crdAPIClient.getLatestCalculationForPrisoner(nomsId)
      this.manualEntryService.populateExistingDates(req, nomsId, latestCalculation.dates)
    }

    req.session.unchangedManualJourney = existingManualJourney
    req.session.manualJourneyDifferentDatesConfirmed = false

    return res.render(
      'pages/manualEntry/manualEntry',
      new ManualEntryLandingPageViewModel(
        prisonerDetail,
        hasIndeterminateSentences,
        req.originalUrl,
        {
          unsupportedSentenceMessages: unsupportedSentenceOrCalculationMessages.unsupportedSentenceMessages,
          unsupportedCalculationMessages: unsupportedSentenceOrCalculationMessages.unsupportedCalculationMessages,
          unsupportedManualMessages: unsupportedSentenceOrCalculationMessages.unsupportedManualMessages,
        },
        existingManualJourney,
      ),
    )
  }

  private async validateUseOfManualCalculationJourneyOrRedirect(
    nomsId: string,
    token: string,
    bookingId: number,
    req: Request,
    validationMessages?: ValidationMessage[],
  ) {
    if (
      req.session.manualEntryRoutingForBookings === undefined ||
      req.session.manualEntryRoutingForBookings.includes(nomsId) === false
    ) {
      const unsupportedSentenceOrCalculationMessages =
        validationMessages ||
        (await this.calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages(nomsId, token))
      const hasRecallSentences = await this.manualCalculationService.hasRecallSentences(bookingId, token)

      if (unsupportedSentenceOrCalculationMessages.length === 0 && !hasRecallSentences) {
        return `/calculation/${nomsId}/check-information`
      }
    }
    return null
  }

  public submitSelectedDates: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, userRoles, username } = res.locals.user
    const { nomsId } = req.params

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, username, caseloads, userRoles)

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

    const existingDates = this.existingDatesInSession(req, nomsId)
      ? req.session.selectedManualEntryDates[nomsId].map((d: ManualEntrySelectedDate) => d.dateType)
      : []

    const { error, config } = await this.manualEntryService.verifySelectedDateType(
      token,
      req,
      nomsId,
      hasIndeterminateSentences,
      false,
      existingDates,
    )
    if (error) {
      const insufficientDatesSelected = true
      return res.render(
        'pages/manualEntry/dateTypeSelection',
        new ManualEntrySelectDatesViewModel(prisonerDetail, config, req.originalUrl, insufficientDatesSelected),
      )
    }

    await this.manualEntryService.addManuallyCalculatedDateTypes(token, req, nomsId)
    const firstManualDates = req.session.selectedManualEntryDates[nomsId].find(
      (d: ManualJourneySelectedDate) => !d.completed,
    )
    return res.redirect(`/calculation/${nomsId}/manual-entry/enter-date?dateType=${firstManualDates.dateType}`)
  }

  public dateSelection: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, userRoles, username } = res.locals.user
    const { nomsId } = req.params
    const { unchangedManualJourney } = req.session

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, username, caseloads, userRoles)

    if (!req.session.selectedManualEntryDates) {
      req.session.selectedManualEntryDates = {}
    }

    const redirect = await this.validateUseOfManualCalculationJourneyOrRedirect(
      nomsId,
      token,
      prisonerDetail.bookingId,
      req,
    )
    if (redirect) {
      return res.redirect(redirect)
    }

    const existingDates: string[] = this.existingDatesInSession(req, nomsId)
      ? req.session.selectedManualEntryDates[nomsId]
          .filter(d => d.completed === true)
          .map((d: ManualJourneySelectedDate) => d.dateType)
      : []

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
      existingDates,
    )
    return res.render(
      'pages/manualEntry/dateTypeSelection',
      new ManualEntrySelectDatesViewModel(prisonerDetail, config, req.originalUrl, Boolean(unchangedManualJourney)),
    )
  }

  public enterDate: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, userRoles, username } = res.locals.user
    const { nomsId } = req.params
    const { dateType } = req.query as Record<string, string>

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, username, caseloads, userRoles)

    const redirect = await this.validateUseOfManualCalculationJourneyOrRedirect(
      nomsId,
      token,
      prisonerDetail.bookingId,
      req,
    )
    if (redirect) {
      return res.redirect(redirect)
    }

    const manualDates = req.session.selectedManualEntryDates[nomsId]

    if (manualDates.length === 0) {
      return res.redirect(`/calculation/${nomsId}/manual-entry/select-dates`)
    }

    const nextDate =
      (typeof dateType === 'string' && this.manualEntryService.getDateByType(manualDates, dateType)) ||
      this.manualEntryService.getNextDateToEnter(manualDates)

    if (nextDate && nextDate.dateType !== 'None') {
      const previousDate = this.manualEntryService.getPreviousDate(
        req.session.selectedManualEntryDates[nomsId],
        nextDate,
      )

      const backlink = this.getEnterDatesBackLink(req, nomsId, previousDate)

      return res.render(
        'pages/manualEntry/dateEntry',
        new ManualEntryDateEntryViewModel(
          prisonerDetail,
          backlink,
          nextDate.manualEntrySelectedDate,
          nextDate.manualEntrySelectedDate.date,
          req.originalUrl,
        ),
      )
    }
    if (nextDate && nextDate.dateType === 'None') {
      return res.redirect(`/calculation/${nomsId}/manual-entry/no-dates-confirmation`)
    }
    return res.redirect(`/calculation/${nomsId}/manual-entry/confirmation`)
  }

  public submitDate: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, userRoles, username } = res.locals.user
    const { nomsId } = req.params
    const { dateType } = req.query as Record<string, string>

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, username, caseloads, userRoles)

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
    const { success, message, isNone, date, enteredDate } = storeDateResponse

    if (!success && message && !isNone) {
      const previousDate = this.manualEntryService.getPreviousDateByType(
        req.session.selectedManualEntryDates[nomsId],
        date?.dateType,
      )

      const backlink = this.getEnterDatesBackLink(req, nomsId, previousDate)

      return res.render(
        'pages/manualEntry/dateEntry',
        new ManualEntryDateEntryViewModel(
          prisonerDetail,
          backlink,
          date,
          undefined,
          req.originalUrl,
          message,
          enteredDate,
        ),
      )
    }

    if (success && this.manualEntryService.getNextDateToEnter(req.session.selectedManualEntryDates[nomsId], dateType)) {
      return res.redirect(`/calculation/${nomsId}/manual-entry/enter-date`)
    }

    req.session.selectedManualEntryDates[nomsId] = req.session.selectedManualEntryDates[nomsId].map(
      (d: ManualJourneySelectedDate) => ({
        ...d,
        completed: true,
      }),
    )

    return res.redirect(`/calculation/${nomsId}/manual-entry/confirmation`)
  }

  public loadConfirmation: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, userRoles, username } = res.locals.user
    const { nomsId } = req.params
    const { confirmationError, reconfirm } = req.query

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, username, caseloads, userRoles)

    if (reconfirm) req.session.manualJourneyDifferentDatesConfirmed = false

    const { manualJourneyDifferentDatesConfirmed, unchangedManualJourney } = req.session

    if (req.session.calculationReasonId == null) {
      return res.redirect(`/calculation/${nomsId}/reason`)
    }

    const newManualDates: ManualJourneySelectedDate[] = req.session.selectedManualEntryDates[nomsId] ?? []

    req.session.selectedManualEntryDates[nomsId] = newManualDates.filter(d => d.completed === true)

    const redirect = await this.validateUseOfManualCalculationJourneyOrRedirect(
      nomsId,
      token,
      prisonerDetail.bookingId,
      req,
    )
    if (redirect) {
      return res.redirect(redirect)
    }

    const allowEditDates = !unchangedManualJourney || manualJourneyDifferentDatesConfirmed

    const rows = await this.manualEntryService.getConfirmationConfiguration(token, req, nomsId, allowEditDates)

    if (rows.length === 0) {
      return res.redirect(`/calculation/${nomsId}/manual-entry/select-dates`)
    }

    const viewModel = new ManualEntryConfirmationViewModel(
      prisonerDetail,
      rows,
      req.originalUrl,
      Boolean(unchangedManualJourney),
      Boolean(confirmationError),
      manualJourneyDifferentDatesConfirmed,
    )

    return res.render('pages/manualEntry/confirmation', viewModel)
  }

  public loadConfirmationSubmit: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params

    if (req.body == null || (req.body['confirm-dates'] !== 'yes' && req.body['confirm-dates'] !== 'no')) {
      return res.redirect(`/calculation/${nomsId}/manual-entry/confirmation?confirmationError=1`)
    }

    if (req.body['confirm-dates'] === 'yes') {
      return res.redirect(`/calculation/${nomsId}/manual-entry/save`)
    }

    req.session.manualJourneyDifferentDatesConfirmed = true

    return res.redirect(`/calculation/${nomsId}/manual-entry/confirmation`)
  }

  public loadRemoveDate: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, userRoles, username } = res.locals.user
    const { nomsId } = req.params

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, username, caseloads, userRoles)

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
    const { caseloads, token, userRoles, username } = res.locals.user
    const { nomsId } = req.params

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, username, caseloads, userRoles)

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

  public save: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, username, userRoles } = res.locals.user
    const { nomsId } = req.params

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, username, caseloads, userRoles)

    if (req.session.calculationReasonId == null) {
      return res.redirect(`/calculation/${nomsId}/reason`)
    }

    const redirect = await this.validateUseOfManualCalculationJourneyOrRedirect(
      nomsId,
      token,
      prisonerDetail.bookingId,
      req,
    )
    if (redirect) {
      return res.redirect(redirect)
    }

    try {
      const response = await this.manualCalculationService.storeManualCalculation(username, nomsId, req, token)
      const isNone =
        req.session.selectedManualEntryDates[nomsId].length === 1 &&
        req.session.selectedManualEntryDates[nomsId][0].dateType === 'None'
      const baseUrl = `/calculation/${nomsId}/complete/${response.calculationRequestId}`
      const fullUrl = isNone ? `${baseUrl}?noDates=true` : `${baseUrl}`
      return res.redirect(fullUrl)
    } catch (error) {
      // TODO Move handling of validation errors from the api into the service layer
      logger.error(error)
      if (error.status === 412) {
        req.flash(
          'serverErrors',
          JSON.stringify({
            messages: [
              {
                text: 'The booking data that was used for this calculation has changed, go back to the Check NOMIS Information screen to see the changes',
                href: `/calculation/${nomsId}/check-information`,
              },
            ],
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
      // Once the journey is completed clear down the session var that prevents the revalidation
      if (req.session.manualEntryRoutingForBookings) {
        req.session.manualEntryRoutingForBookings.splice(
          req.session.manualEntryRoutingForBookings.findIndex(i => i === nomsId),
          1,
        )
      }
      return res.redirect(`/calculation/${nomsId}/manual-entry/confirmation`)
    }
  }

  public noDatesConfirmation: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, userRoles, username } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, username, caseloads, userRoles)

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
    const { caseloads, token, userRoles, username } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, username, caseloads, userRoles)

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
        {
          position: 1,
          dateType: 'None',
          manualEntrySelectedDate: {
            dateType: 'None',
            dateText: 'None of the above dates apply',
            date: null,
          },
          completed: true,
        } as ManualJourneySelectedDate,
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

  private existingDatesInSession(req, nomsId: string): boolean {
    return (
      req.session.selectedManualEntryDates != null &&
      req.session.selectedManualEntryDates[nomsId] != null &&
      req.session.selectedManualEntryDates[nomsId].length > 0
    )
  }

  private getEnterDatesBackLink(req, nomsId: string, previousDate?: ManualEntrySelectedDate) {
    const numberOfDates = req.session.selectedManualEntryDates[nomsId].filter(
      (d: ManualJourneySelectedDate) => d.completed === false,
    ).length

    if (!previousDate && numberOfDates) {
      return `/calculation/${nomsId}/manual-entry/select-dates`
    }

    if (previousDate) {
      return `/calculation/${nomsId}/manual-entry/enter-date?dateType=${previousDate.dateType}`
    }

    return `/calculation/${nomsId}/manual-entry/confirmation`
  }
}

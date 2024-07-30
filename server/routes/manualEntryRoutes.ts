import { RequestHandler } from 'express'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import PrisonerService from '../services/prisonerService'
import ManualCalculationService from '../services/manualCalculationService'
import ManualEntryService from '../services/manualEntryService'
import logger from '../../logger'
import { ErrorMessages, ErrorMessageType } from '../types/ErrorMessages'
import {
  ManualEntrySelectedDate,
  SubmittedDate,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ManualEntryConfirmationViewModel from '../models/ManualEntryConfirmationViewModel'
import ManualEntryDateEntryViewModel from '../models/ManualEntryDateEntryViewModel'
import ManualEntrySelectDatesViewModel from '../models/ManualEntrySelectDatesViewModel'
import ManualEntryLandingPageViewModel from '../models/ManualEntryLandingPageViewModel'
import ManualEntryNoDatesConfirmationViewModel from '../models/ManualEntryNoDatesConfirmationViewModel'
import ManualEntryRemoteDateViewModel from '../models/ManualEntryRemoteDateViewModel'
import { Response } from 'express-serve-static-core'

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
    const {caseloads, token} = res.locals.user
    const {nomsId} = req.params

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    await this.validateUseOfManualCalculationJourneyOrRedirect(nomsId, token, prisonerDetail.bookingId, res)

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
        new ManualEntryLandingPageViewModel(prisonerDetail, hasIndeterminateSentences),
    )
  }

  private async validateUseOfManualCalculationJourneyOrRedirect(nomsId: string, token: string, bookingId: number, response: Response) {
    const unsupportedSentenceOrCalculationMessages =
        await this.calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages(nomsId, token)

    const hasRecallSentences = await this.manualCalculationService.hasRecallSentences(bookingId, token)

    if (unsupportedSentenceOrCalculationMessages.length === 0 || !hasRecallSentences) {
      return response.redirect(`/calculation/${nomsId}/check-information`)
    }
  }

  public submitSelectedDates: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)

    await this.validateUseOfManualCalculationJourneyOrRedirect(nomsId, token, prisonerDetail.bookingId, res)

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
        new ManualEntrySelectDatesViewModel(prisonerDetail, config, insufficientDatesSelected),
      )
    }
    await this.manualEntryService.addManuallyCalculatedDateTypes(token, req, nomsId)
    return res.redirect(`/calculation/${nomsId}/manual-entry/enter-date`)
  }

  public dateSelection: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)

    await this.validateUseOfManualCalculationJourneyOrRedirect(nomsId, token, prisonerDetail.bookingId, res)

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
      new ManualEntrySelectDatesViewModel(prisonerDetail, config),
    )
  }

  public enterDate: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const { year, month, day } = req.query
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)

    await this.validateUseOfManualCalculationJourneyOrRedirect(nomsId, token, prisonerDetail.bookingId, res)

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
        new ManualEntryDateEntryViewModel(prisonerDetail, date, previousDate),
      )
    }
    if (date && date.dateType === 'None') {
      return res.redirect(`/calculation/${nomsId}/manual-entry/no-dates-confirmation`)
    }
    return res.redirect(`/calculation/${nomsId}/manual-entry/confirmation`)
  }

  public submitDate: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)

    await this.validateUseOfManualCalculationJourneyOrRedirect(nomsId, token, prisonerDetail.bookingId, res)

    const storeDateResponse = this.manualEntryService.storeDate(req.session.selectedManualEntryDates[nomsId], req.body)
    if (!storeDateResponse.success && storeDateResponse.message && !storeDateResponse.isNone) {
      const { date, message, enteredDate } = storeDateResponse
      return res.render(
        'pages/manualEntry/dateEntry',
        new ManualEntryDateEntryViewModel(prisonerDetail, date, undefined, message, enteredDate),
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

  public loadConfirmation: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)

    await this.validateUseOfManualCalculationJourneyOrRedirect(nomsId, token, prisonerDetail.bookingId, res)

    const rows = await this.manualEntryService.getConfirmationConfiguration(token, req, nomsId)
    return res.render('pages/manualEntry/confirmation', new ManualEntryConfirmationViewModel(prisonerDetail, rows))
  }

  public loadRemoveDate: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)

    await this.validateUseOfManualCalculationJourneyOrRedirect(nomsId, token, prisonerDetail.bookingId, res)

    const dateToRemove: string = <string>req.query.dateType
    if (
      req.session.selectedManualEntryDates[nomsId].some((d: ManualEntrySelectedDate) => d.dateType === dateToRemove)
    ) {
      const fullDateName = await this.manualEntryService.fullStringLookup(token, dateToRemove)
      return res.render(
        'pages/manualEntry/removeDate',
        new ManualEntryRemoteDateViewModel(prisonerDetail, dateToRemove, fullDateName),
      )
    }
    return res.redirect(`/calculation/${nomsId}/manual-entry/confirmation`)
  }

  public submitRemoveDate: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)

    await this.validateUseOfManualCalculationJourneyOrRedirect(nomsId, token, prisonerDetail.bookingId, res)

    const dateToRemove: string = <string>req.query.dateType
    const fullDateName = await this.manualEntryService.fullStringLookup(token, dateToRemove)
    if (req.body['remove-date'] !== 'yes' && req.body['remove-date'] !== 'no') {
      return res.render(
        'pages/manualEntry/removeDate',
        new ManualEntryRemoteDateViewModel(prisonerDetail, dateToRemove, fullDateName, true),
      )
    }
    const remainingDates = this.manualEntryService.removeDate(req, nomsId)
    if (remainingDates === 0) {
      return res.redirect(`/calculation/${nomsId}/manual-entry/select-dates`)
    }
    return res.redirect(`/calculation/${nomsId}/manual-entry/confirmation`)
  }

  public loadChangeDate: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)

    await this.validateUseOfManualCalculationJourneyOrRedirect(nomsId, token, prisonerDetail.bookingId, res)

    const { date } = await this.manualEntryService.changeDate(token, req, nomsId)
    return res.redirect(
      `/calculation/${nomsId}/manual-entry/enter-date?year=${date.year}&month=${date.month}&day=${date.day}`,
    )
  }

  public save: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)

    await this.validateUseOfManualCalculationJourneyOrRedirect(nomsId, token, prisonerDetail.bookingId, res)

    try {
      const response = await this.manualCalculationService.storeManualCalculation(nomsId, req, token)
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
      return res.redirect(`/calculation/${nomsId}/manual-entry/confirmation`)
    }
  }

  public noDatesConfirmation: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)

    await this.validateUseOfManualCalculationJourneyOrRedirect(nomsId, token, prisonerDetail.bookingId, res)

    return res.render(
      'pages/manualEntry/noDatesConfirmation',
      new ManualEntryNoDatesConfirmationViewModel(prisonerDetail),
    )
  }

  public submitNoDatesConfirmation: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)

    await this.validateUseOfManualCalculationJourneyOrRedirect(nomsId, token, prisonerDetail.bookingId, res)

    if (
      req.body['no-date-selection'] === 'yes' &&
      req.session.selectedManualEntryDates[nomsId].length === 1 &&
      req.session.selectedManualEntryDates[nomsId][0].dateType === 'None'
    ) {
      return res.redirect(`/calculation/${nomsId}/manual-entry/save`)
    }
    if (req.body['no-date-selection'] === 'no') {
      req.session.selectedManualEntryDates[nomsId] = []
      return res.redirect(`/calculation/${nomsId}/manual-entry/select-dates`)
    }
    const error = true
    return res.render(
      'pages/manualEntry/noDatesConfirmation',
      new ManualEntryNoDatesConfirmationViewModel(prisonerDetail, error),
    )
  }
}

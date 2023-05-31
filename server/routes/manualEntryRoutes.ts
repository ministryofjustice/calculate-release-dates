import { RequestHandler } from 'express'
import dayjs from 'dayjs'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import PrisonerService from '../services/prisonerService'
import ManualCalculationService from '../services/manualCalculationService'
import { ManualEntrySelectedDate } from '../models/ManualEntrySelectedDate'

const determinateConfig = {
  name: 'dateSelect',
  fieldset: {
    legend: {
      text: 'Select the dates you need to enter',
      isPageHeading: true,
      classes: 'govuk-fieldset__legend--xl',
    },
  },
  hint: {
    text: 'Select all that apply to the manual calculation.',
  },
  items: [
    {
      value: 'SED',
      text: 'SED (Sentence Expiry Date)',
      checked: false,
      attributes: {},
    },
    {
      value: 'LED',
      text: 'LED (Licence Expiry Date)',
      checked: false,
      attributes: {},
    },
    {
      value: 'CRD',
      attributes: {},
      checked: false,
      text: 'CRD (Conditional Release Date)',
    },
    {
      attributes: {},
      checked: false,
      value: 'HDCED',
      text: 'HDCED (Home Detention Curfew Release Date)',
    },
    {
      value: 'TUSED',
      attributes: {},
      checked: false,
      text: 'TUSED (Top Up Supervision Expiry Date)',
    },
    {
      value: 'PRRD',
      attributes: {},
      checked: false,
      text: 'PRRD (Post Recall Release Date)',
    },
    {
      value: 'PED',
      attributes: {},
      checked: false,
      text: 'PED (Parole Eligibility Date)',
    },
    {
      value: 'ROTL',
      checked: false,
      attributes: {},
      text: 'ROTL (Release on Temporary Licence)',
    },
    {
      value: 'ERSED',
      attributes: {},
      checked: false,
      text: 'ERSED (Early Removal Scheme Eligibility Date)',
    },
    {
      value: 'ARD',
      attributes: {},
      checked: false,
      text: 'ARD (Automatic Release Date)',
    },
    {
      value: 'HDCAD',
      attributes: {},
      checked: false,
      text: 'HDCAD (Home Detention Curfew Approved Date)',
    },
    {
      value: 'MTD',
      attributes: {},
      checked: false,
      text: 'MTD (Mid Transfer Date)',
    },
    {
      value: 'ETD',
      attributes: {},
      checked: false,
      text: 'ETD (Early Transfer Date)',
    },
    {
      value: 'LTD',
      attributes: {},
      checked: false,
      text: 'LTD (Late Transfer Date)',
    },
    {
      value: 'APD',
      attributes: {},
      checked: false,
      text: 'APD (Approved Parole Date)',
    },
    {
      value: 'NPD',
      attributes: {},
      checked: false,
      text: 'NPD (Non-Parole Date)',
    },
    {
      value: 'DPRRD',
      attributes: {},
      checked: false,
      text: 'DPRRD (Detention and Training Order Post Recall Release Date)',
    },
  ],
}
const indeterminateConfig = {
  name: 'dateSelect',
  fieldset: {
    legend: {
      text: 'Select the dates you need to enter',
      isPageHeading: true,
      classes: 'govuk-fieldset__legend--xl',
    },
  },
  hint: {
    text: 'Select all that apply to the manual calculation.',
  },
  items: [
    {
      value: 'tariff',
      checked: false,
      attributes: {},
      text: 'Tariff',
    },
    {
      value: 'TERSED',
      attributes: {},
      checked: false,
      text: 'TERSED (Tariff-Expired Removal Scheme Eligibility Date)',
    },
    {
      value: 'ROTL',
      attributes: {},
      checked: false,
      text: 'ROTL (Release on Temporary Licence)',
    },
    {
      value: 'APD',
      attributes: {},
      checked: false,
      text: 'APD (Approved Parole Date)',
    },
    {
      divider: 'or',
    },
    {
      value: 'none',
      text: 'None',
      attributes: {},
      checked: false,
      behaviour: 'exclusive',
    },
  ],
}
const errorMessage = {
  errorMessage: {
    text: 'Select at least one release date.',
  },
}
const fullStringLookup = {
  SED: 'SED (Sentence Expiry Date)',
  LED: 'LED (Licence Expiry Date)',
  CRD: 'CRD (Conditional Release Date)',
  HDCED: 'HDCED (Home Detention Curfew Release Date)',
  TUSED: 'TUSED (Top Up Supervision Expiry Date)',
  PRRD: 'PRRD (Post Recall Release Date)',
  PED: 'PED (Parole Eligibility Date)',
  ROTL: 'ROTL (Release on Temporary Licence)',
  ERSED: 'ERSED (Early Removal Scheme Eligibility Date)',
  ARD: 'ARD (Automatic Release Date)',
  HDCAD: 'HDCAD (Home Detention Curfew Approved Date)',
  MTD: 'MTD (Mid Transfer Date)',
  ETD: 'ETD (Early Transfer Date)',
  LTD: 'LTD (Late Transfer Date)',
  APD: 'APD (Approved Parole Date)',
  NPD: 'NPD (Non-Parole Date)',
  DPRRD: 'DPRRD (Detention and Training Order Post Recall Release Date)',
  tariff: 'Tariff',
  TERSED: 'TERSED (Tariff-Expired Removal Scheme Eligibility Date)',
}
export default class ManualEntryRoutes {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
    private readonly manualCalculationService: ManualCalculationService
  ) {}

  public landingPage: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const unsupportedSentenceOrCalculationMessages =
      await this.calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages(nomsId, token)
    if (unsupportedSentenceOrCalculationMessages.length === 0) {
      return res.redirect(`/calculation/${nomsId}/check-information`)
    }
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    req.session.selectedManualEntryDates = undefined
    return res.render('pages/manualEntry/manualEntry', { prisonerDetail })
  }

  public submitSelectedDates: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId } = req.params
    // TODO add this as middleware
    const unsupportedSentenceOrCalculationMessages =
      await this.calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages(nomsId, token)
    if (unsupportedSentenceOrCalculationMessages.length === 0) {
      return res.redirect(`/calculation/${nomsId}/check-information`)
    }
    if (req.session.selectedManualEntryDates === undefined) {
      req.session.selectedManualEntryDates = []
    }
    const insufficientDatesSelected =
      req.session.selectedManualEntryDates.length === 0 &&
      (req.body.dateSelect === undefined || req.body.dateSelect.length === 0)
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    const hasIndeterminateSentences = await this.manualCalculationService.hasIndeterminateSentences(
      prisonerDetail.bookingId,
      token
    )
    const config = hasIndeterminateSentences ? indeterminateConfig : determinateConfig
    if (insufficientDatesSelected) {
      const mergedConfig = { ...config, ...errorMessage }
      // eslint-disable-next-line no-restricted-syntax
      for (const item of mergedConfig.items) {
        if (req.session.selectedManualEntryDates.some((d: ManualEntrySelectedDate) => d.dateType === item.value)) {
          item.checked = true
          item.attributes = {
            disabled: true,
          }
        } else {
          item.checked = false
          item.attributes = {}
        }
      }
      return res.render('pages/manualEntry/dateTypeSelection', {
        prisonerDetail,
        insufficientDatesSelected,
        mergedConfig,
      })
    }
    const selectedDateTypes: string[] = Array.isArray(req.body.dateSelect) ? req.body.dateSelect : [req.body.dateSelect]
    const dates = selectedDateTypes
      .map((date: string) => {
        if (date !== undefined) {
          const existingDate = req.session.selectedManualEntryDates.find(
            (d: ManualEntrySelectedDate) => d !== undefined && d.dateType === date
          )
          if (existingDate) {
            return {
              dateType: date,
              dateText: fullStringLookup[date],
              date: existingDate.date,
            } as ManualEntrySelectedDate
          }
          return {
            dateType: date,
            dateText: fullStringLookup[date],
            date: undefined,
          } as ManualEntrySelectedDate
        }
        return null
      })
      .filter(obj => obj !== null)
    req.session.selectedManualEntryDates = [...req.session.selectedManualEntryDates, ...dates]
    return res.redirect(`/calculation/${nomsId}/manual-entry/enter-date`)
  }

  public dateSelection: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const unsupportedSentenceOrCalculationMessages =
      await this.calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages(nomsId, token)
    if (unsupportedSentenceOrCalculationMessages.length === 0) {
      return res.redirect(`/calculation/${nomsId}/check-information`)
    }
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    const hasIndeterminateSentences = await this.manualCalculationService.hasIndeterminateSentences(
      prisonerDetail.bookingId,
      token
    )
    const config = hasIndeterminateSentences ? indeterminateConfig : determinateConfig
    // eslint-disable-next-line no-restricted-syntax
    for (const item of config.items) {
      if (
        req.session.selectedManualEntryDates !== undefined &&
        req.session.selectedManualEntryDates.some(
          (d: ManualEntrySelectedDate) => d !== undefined && d.dateType === item.value
        )
      ) {
        item.checked = true
        item.attributes = {
          disabled: true,
        }
      } else {
        item.checked = false
        item.attributes = {}
      }
    }
    return res.render('pages/manualEntry/dateTypeSelection', { prisonerDetail, config })
  }

  public enterDate: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    const unsupportedSentenceOrCalculationMessages =
      await this.calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages(nomsId, token)
    if (unsupportedSentenceOrCalculationMessages.length === 0) {
      return res.redirect(`/calculation/${nomsId}/check-information`)
    }
    const hasDateToEnter = req.session.selectedManualEntryDates.some(
      (d: ManualEntrySelectedDate) => d !== undefined && d.date === undefined
    )
    if (hasDateToEnter) {
      const date = req.session.selectedManualEntryDates.find(
        (d: ManualEntrySelectedDate) => d !== undefined && d.date === undefined
      )
      return res.render('pages/manualEntry/dateEntry', { prisonerDetail, date })
    }
    return res.redirect(`/calculation/${nomsId}/manual-entry/confirmation`)
  }

  public submitDate: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    const unsupportedSentenceOrCalculationMessages =
      await this.calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages(nomsId, token)
    if (unsupportedSentenceOrCalculationMessages.length === 0) {
      return res.redirect(`/calculation/${nomsId}/check-information`)
    }
    const enteredDate = req.body
    if (enteredDate.dateType !== 'none') {
      if (enteredDate.day === '' || enteredDate.month === '' || enteredDate.year === '') {
        const date = req.session.selectedManualEntryDates.find(
          (d: ManualEntrySelectedDate) => d.dateType === enteredDate.dateType
        )
        const error = 'The date entered must include a day, month and a year.'
        return res.render('pages/manualEntry/dateEntry', { prisonerDetail, date, error, enteredDate })
      }
      req.session.selectedManualEntryDates.find(
        (d: ManualEntrySelectedDate) => d.dateType === enteredDate.dateType
      ).date = enteredDate
      return res.redirect(`/calculation/${nomsId}/manual-entry/enter-date`)
    }
    return res.redirect(`/calculation/${nomsId}/manual-entry/confirmation`)
  }

  public loadConfirmation: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    const unsupportedSentenceOrCalculationMessages =
      await this.calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages(nomsId, token)
    if (unsupportedSentenceOrCalculationMessages.length === 0) {
      return res.redirect(`/calculation/${nomsId}/check-information`)
    }
    const rows = req.session.selectedManualEntryDates.map((d: ManualEntrySelectedDate) => {
      const dateString = `${d.date.year}-${d.date.month}-${d.date.day}`
      const dateValue = dayjs(dateString).format('DD MMMM YYYY')
      const text = fullStringLookup[d.dateType]
      return {
        key: {
          text,
        },
        value: {
          text: dateValue,
        },
        actions: {
          items: [
            {
              href: `/calculation/${nomsId}/manual-entry/change-date?dateType=${d.dateType}`,
              text: 'Change',
              visuallyHiddenText: `Change ${text}`,
            },
            {
              href: `/calculation/${nomsId}/manual-entry/remove-date?dateType=${d.dateType}`,
              text: 'Remove',
              visuallyHiddenText: `Remove ${text}`,
            },
          ],
        },
      }
    })
    return res.render('pages/manualEntry/confirmation', { prisonerDetail, rows })
  }

  public loadRemoveDate: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    const unsupportedSentenceOrCalculationMessages =
      await this.calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages(nomsId, token)
    if (unsupportedSentenceOrCalculationMessages.length === 0) {
      return res.redirect(`/calculation/${nomsId}/check-information`)
    }
    const dateToRemove: string = <string>req.query.dateType
    if (req.session.selectedManualEntryDates.some((d: ManualEntrySelectedDate) => d.dateType === dateToRemove)) {
      const fullDateName = fullStringLookup[dateToRemove]
      return res.render('pages/manualEntry/removeDate', { prisonerDetail, dateToRemove, fullDateName })
    }
    return res.redirect(`/calculation/${nomsId}/manual-entry/confirmation`)
  }

  public submitRemoveDate: RequestHandler = async (req, res): Promise<void> => {
    const { token } = res.locals.user
    const { nomsId } = req.params
    const unsupportedSentenceOrCalculationMessages =
      await this.calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages(nomsId, token)
    if (unsupportedSentenceOrCalculationMessages.length === 0) {
      return res.redirect(`/calculation/${nomsId}/check-information`)
    }
    const dateToRemove = req.query.dateType
    if (req.body['remove-date'] === 'yes') {
      req.session.selectedManualEntryDates = req.session.selectedManualEntryDates.filter(
        (d: ManualEntrySelectedDate) => d.dateType !== dateToRemove
      )
    }
    if (req.session.selectedManualEntryDates.length === 0) {
      return res.redirect(`/calculation/${nomsId}/manual-entry/select-dates`)
    }
    return res.redirect(`/calculation/${nomsId}/manual-entry/confirmation`)
  }

  public loadChangeDate: RequestHandler = async (req, res): Promise<void> => {
    const { token } = res.locals.user
    const { nomsId } = req.params
    const unsupportedSentenceOrCalculationMessages =
      await this.calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages(nomsId, token)
    if (unsupportedSentenceOrCalculationMessages.length === 0) {
      return res.redirect(`/calculation/${nomsId}/check-information`)
    }

    req.session.selectedManualEntryDates = req.session.selectedManualEntryDates.filter(
      (d: ManualEntrySelectedDate) => d.dateType !== req.query.dateType
    )
    req.session.selectedManualEntryDates.push({
      dateType: req.query.dateType,
      dateText: fullStringLookup[<string>req.query.dateType],
      date: undefined,
    } as ManualEntrySelectedDate)
    return res.redirect(`/calculation/${nomsId}/manual-entry/enter-date`)
  }
}

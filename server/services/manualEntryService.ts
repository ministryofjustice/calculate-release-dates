import { Request } from 'express'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import { DateTime } from 'luxon'
import { ManualEntrySelectedDate } from '../models/ManualEntrySelectedDate'
import ManualEntryValidationService from './manualEntryValidationService'

dayjs.extend(isBetween)
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
  Tariff: 'Tariff (known as the Tariff expiry date)',
  TERSED: 'TERSED (Tariff-Expired Removal Scheme Eligibility Date)',
  None: 'None of the above dates apply',
}

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
      text: 'SED (Sentence expiry date)',
      checked: false,
      attributes: {},
    },
    {
      value: 'LED',
      text: 'LED (Licence expiry date)',
      checked: false,
      attributes: {},
    },
    {
      value: 'CRD',
      attributes: {},
      checked: false,
      text: 'CRD (Conditional release date)',
    },
    {
      attributes: {},
      checked: false,
      value: 'HDCED',
      text: 'HDCED (Home detention curfew release date)',
    },
    {
      value: 'TUSED',
      attributes: {},
      checked: false,
      text: 'TUSED (Top up supervision expiry date)',
    },
    {
      value: 'PRRD',
      attributes: {},
      checked: false,
      text: 'PRRD (Post recall release date)',
    },
    {
      value: 'PED',
      attributes: {},
      checked: false,
      text: 'PED (Parole eligibility date)',
    },
    {
      value: 'ROTL',
      checked: false,
      attributes: {},
      text: 'ROTL (Release on temporary licence)',
    },
    {
      value: 'ERSED',
      attributes: {},
      checked: false,
      text: 'ERSED (Early removal scheme eligibility date)',
    },
    {
      value: 'ARD',
      attributes: {},
      checked: false,
      text: 'ARD (Automatic release date)',
    },
    {
      value: 'HDCAD',
      attributes: {},
      checked: false,
      text: 'HDCAD (Home detention curfew approved date)',
    },
    {
      value: 'MTD',
      attributes: {},
      checked: false,
      text: 'MTD (Mid transfer date)',
    },
    {
      value: 'ETD',
      attributes: {},
      checked: false,
      text: 'ETD (Early transfer date)',
    },
    {
      value: 'LTD',
      attributes: {},
      checked: false,
      text: 'LTD (Late transfer date)',
    },
    {
      value: 'APD',
      attributes: {},
      checked: false,
      text: 'APD (Approved parole date)',
    },
    {
      value: 'NPD',
      attributes: {},
      checked: false,
      text: 'NPD (Non-parole date)',
    },
    {
      value: 'DPRRD',
      attributes: {},
      checked: false,
      text: 'DPRRD (Detention and training order post recall release date)',
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
      value: 'Tariff',
      checked: false,
      attributes: {},
      text: 'Tariff (known as the Tariff expiry date)',
    },
    {
      value: 'TERSED',
      attributes: {},
      checked: false,
      text: 'TERSED (Tariff expired removal scheme eligibility date)',
    },
    {
      value: 'ROTL',
      attributes: {},
      checked: false,
      text: 'ROTL (Release on temporary licence)',
    },
    {
      value: 'APD',
      attributes: {},
      checked: false,
      text: 'APD (Approved parole date)',
    },
    {
      divider: 'or',
    },
    {
      value: 'None',
      text: 'None of these dates apply',
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
export default class ManualEntryService {
  constructor(private readonly manualEntryValidationService: ManualEntryValidationService) {}

  public verifySelectedDateType(
    req: Request,
    nomsId: string,
    hasIndeterminateSentences: boolean,
    firstLoad: boolean
  ): { error: boolean; config: DateSelectConfiguration } {
    if (!req.session.selectedManualEntryDates[nomsId]) {
      req.session.selectedManualEntryDates[nomsId] = []
    }
    const insufficientDatesSelected =
      !firstLoad &&
      req.session.selectedManualEntryDates[nomsId].length === 0 &&
      (req.body.dateSelect === undefined || req.body.dateSelect.length === 0)
    const config: DateSelectConfiguration = hasIndeterminateSentences
      ? (indeterminateConfig as DateSelectConfiguration)
      : (determinateConfig as DateSelectConfiguration)
    if (insufficientDatesSelected) {
      const mergedConfig = { ...config, ...errorMessage }
      // eslint-disable-next-line no-restricted-syntax
      this.enrichConfiguration(mergedConfig, req, nomsId)
      return { error: true, config: mergedConfig }
    }
    const selectedDateTypes: string[] = Array.isArray(req.body.dateSelect) ? req.body.dateSelect : [req.body.dateSelect]
    const validationMessage = this.manualEntryValidationService.validatePairs(selectedDateTypes)
    if (validationMessage) {
      const validationError = { errorMessage: { html: validationMessage } }
      const mergedConfig = { ...config, ...validationError }
      // eslint-disable-next-line no-restricted-syntax
      this.enrichConfiguration(<DateSelectConfiguration>mergedConfig, req, nomsId)
      return { error: true, config: <DateSelectConfiguration>mergedConfig }
    }
    this.enrichConfiguration(config, req, nomsId)
    return { error: false, config: <DateSelectConfiguration>config }
  }

  private enrichConfiguration(mergedConfig: DateSelectConfiguration, req: Request, nomsId: string) {
    // eslint-disable-next-line no-restricted-syntax
    for (const item of mergedConfig.items) {
      if (
        req.session.selectedManualEntryDates[nomsId] &&
        req.session.selectedManualEntryDates[nomsId].some((d: ManualEntrySelectedDate) => d.dateType === item.value)
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
  }

  public addManuallyCalculatedDateTypes(req: Request, nomsId: string): void {
    const selectedDateTypes: string[] = Array.isArray(req.body.dateSelect) ? req.body.dateSelect : [req.body.dateSelect]
    const dates = selectedDateTypes
      .map((date: string) => {
        if (date !== undefined) {
          const existingDate = req.session.selectedManualEntryDates[nomsId].find(
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
    // Do validation here
    req.session.selectedManualEntryDates[nomsId] = [...req.session.selectedManualEntryDates[nomsId], ...dates]
  }

  public getNextDateToEnter(req: Request, nomsId: string): ManualEntrySelectedDate {
    const hasDateToEnter = req.session.selectedManualEntryDates[nomsId].some(
      (d: ManualEntrySelectedDate) => d !== undefined && d.date === undefined
    )
    if (hasDateToEnter) {
      return req.session.selectedManualEntryDates[nomsId].find(
        (d: ManualEntrySelectedDate) => d !== undefined && d.date === undefined
      )
    }
    return undefined
  }

  public storeDate(req: Request, nomsId: string): StorageResponseModel {
    const enteredDate: EnteredDate = req.body
    if (enteredDate.dateType !== 'None') {
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
        return this.allErrored(req, nomsId, enteredDate, allItems)
      }
      const someErrors = this.singleItemsErrored(req, allItems, enteredDate, nomsId)
      if (someErrors) {
        return someErrors
      }
      if (!this.isDateValid(enteredDate)) {
        return this.allErrored(req, nomsId, enteredDate, allItems)
      }
      const notWithinOneHundredYears = this.notWithinOneHundredYears(req, nomsId, enteredDate, allItems)
      if (notWithinOneHundredYears) {
        return notWithinOneHundredYears
      }
      req.session.selectedManualEntryDates[nomsId].find(
        (d: ManualEntrySelectedDate) => d.dateType === enteredDate.dateType
      ).date = enteredDate
      return { success: true, isNone: false } as StorageResponseModel
    }
    return { success: false, isNone: true } as StorageResponseModel
  }

  private isDateValid(enteredDate: EnteredDate): boolean {
    const dateAsDate = DateTime.fromFormat(`${enteredDate.year}-${enteredDate.month}-${enteredDate.day}`, 'yyyy-M-d')
    return dateAsDate.isValid
  }

  private allErrored(req: Request, nomsId: string, enteredDate: EnteredDate, allItems: DateInputItem[]) {
    const date = req.session.selectedManualEntryDates[nomsId].find(
      (d: ManualEntrySelectedDate) => d.dateType === enteredDate.dateType
    )
    const message = 'The date entered must include a valid day, month and a year.'
    const items = allItems.map(it => {
      return { ...it, classes: `${it.classes} govuk-input--error` }
    })
    return { message, date, enteredDate, success: false, items, isNone: false } as StorageResponseModel
  }

  private notWithinOneHundredYears(req: Request, nomsId: string, enteredDate: EnteredDate, allItems: DateInputItem[]) {
    const date = req.session.selectedManualEntryDates[nomsId].find(
      (d: ManualEntrySelectedDate) => d.dateType === enteredDate.dateType
    )
    const dateAsDate = DateTime.fromFormat(`${enteredDate.year}-${enteredDate.month}-${enteredDate.day}`, 'yyyy-M-d')
    const now = DateTime.now()
    const oneHundredYearsBefore = now.minus({ years: 100 })
    const oneHundredYearsAfter = now.plus({ years: 100 })
    if (dateAsDate < oneHundredYearsBefore || dateAsDate > oneHundredYearsAfter) {
      const message = `The date entered must be between ${oneHundredYearsBefore.toFormat(
        'dd MM yyyy'
      )} and ${oneHundredYearsAfter.toFormat('dd MM yyyy')}`
      const items = allItems.map(it => {
        return { ...it, classes: `${it.classes} govuk-input--error` }
      })
      return { message, date, enteredDate, success: false, items, isNone: false } as StorageResponseModel
    }
    return undefined
  }

  private singleItemsErrored(
    req: Request,
    allItems: DateInputItem[],
    enteredDate: EnteredDate,
    nomsId: string
  ): StorageResponseModel {
    let i = 0
    let message = 'The date entered must include a'
    const items = allItems
      .map(it => {
        if (it.name === 'day' && enteredDate.day === '') {
          message += ' day'
          i += 1
          return { ...it, classes: 'govuk-input--width-2 govuk-input--error' }
        }
        if (it.name === 'month' && enteredDate.month === '') {
          if (i === 1) {
            message += ' and '
          }
          message += ' month'
          i += 1
          return { ...it, classes: 'govuk-input--width-2 govuk-input--error' }
        }
        if (it.name === 'year' && enteredDate.year === '') {
          if (i === 1) {
            message += ' and '
          }
          message += ' year'
          i += 1
          return { ...it, classes: 'govuk-input--width-4 govuk-input--error' }
        }
        return undefined
      })
      .filter(it => it !== undefined)
    if (i > 0) {
      const date = req.session.selectedManualEntryDates[nomsId].find(
        (d: ManualEntrySelectedDate) => d.dateType === enteredDate.dateType
      )
      return { message, date, enteredDate, success: false, items, isNone: false } as StorageResponseModel
    }
    return undefined
  }

  private dateString(selectedDate: ManualEntrySelectedDate): string {
    if (selectedDate.dateType === 'None') {
      return ''
    }
    const dateString = `${selectedDate.date.year}-${selectedDate.date.month}-${selectedDate.date.day}`
    return DateTime.fromFormat(dateString, 'yyyy-M-d').toFormat('dd LLLL yyyy')
  }

  public getConfirmationConfiguration(req: Request, nomsId: string) {
    return req.session.selectedManualEntryDates[nomsId].map((d: ManualEntrySelectedDate) => {
      const dateValue = this.dateString(d)
      const text = fullStringLookup[d.dateType]
      const items = this.getItems(nomsId, d, text)
      return {
        key: {
          text,
        },
        value: {
          text: dateValue,
        },
        actions: {
          items,
        },
      }
    })
  }

  private getItems(nomsId: string, d: ManualEntrySelectedDate, text: string) {
    const items = [
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
    ]
    if (d.dateType === 'None') {
      return items.filter(it => it.text !== 'Change')
    }
    return items
  }

  public fullStringLookup(dateType: string): string {
    return fullStringLookup[dateType]
  }

  public removeDate(req: Request, nomsId: string): number {
    const dateToRemove = req.query.dateType
    if (req.body['remove-date'] === 'yes') {
      req.session.selectedManualEntryDates[nomsId] = req.session.selectedManualEntryDates[nomsId].filter(
        (d: ManualEntrySelectedDate) => d.dateType !== dateToRemove
      )
    }
    return req.session.selectedManualEntryDates[nomsId].length
  }

  public changeDate(req: Request, nomsId: string): ManualEntrySelectedDate {
    const date = req.session.selectedManualEntryDates[nomsId].find(
      (d: ManualEntrySelectedDate) => d.dateType === req.query.dateType
    )
    req.session.selectedManualEntryDates[nomsId] = req.session.selectedManualEntryDates[nomsId].filter(
      (d: ManualEntrySelectedDate) => d.dateType !== req.query.dateType
    )
    req.session.selectedManualEntryDates[nomsId].push({
      dateType: req.query.dateType,
      dateText: fullStringLookup[<string>req.query.dateType],
      date: undefined,
    } as ManualEntrySelectedDate)
    return date
  }
}

export interface StorageResponseModel {
  success: boolean
  isNone: boolean
  message: string
  date: ManualEntrySelectedDate
  enteredDate: EnteredDate
  items: DateInputItem[]
}

export interface DateInputItem {
  classes: string
  name: 'day' | 'month' | 'year'
  value: string
}

export interface EnteredDate {
  day: string
  month: string
  year: string
  dateType: string
}

export interface DateSelectConfiguration {
  hint: { text?: string; html?: string }
  name: string
  fieldset: { legend: { classes: string; text: string; isPageHeading: boolean } }
  errorMessage: { text?: string; html?: string }
  items: {
    divider?: string
    checked?: boolean
    attributes?: { disabled?: boolean }
    behaviour?: string
    text?: string
    value?: string
  }[]
}

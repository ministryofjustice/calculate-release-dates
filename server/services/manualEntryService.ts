import { Request } from 'express'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import { DateTime } from 'luxon'
import { ManualEntrySelectedDate } from '../models/ManualEntrySelectedDate'
import ManualEntryValidationService from './manualEntryValidationService'

dayjs.extend(isBetween)
const fullStringLookup = {
  SED: 'SED (Sentence expiry date)',
  LED: 'LED (Licence expiry date)',
  CRD: 'CRD (Conditional release date)',
  HDCED: 'HDCED (Home detention curfew release date)',
  TUSED: 'TUSED (Top up supervision expiry date)',
  PRRD: 'PRRD (Post recall release date)',
  PED: 'PED (Parole eligibility date)',
  ROTL: 'ROTL (Release on temporary licence)',
  ERSED: 'ERSED (Early removal scheme eligibility date)',
  ARD: 'ARD (Automatic release date)',
  HDCAD: 'HDCAD (Home detention curfew approved date)',
  MTD: 'MTD (Mid transfer date)',
  ETD: 'ETD (Early transfer date)',
  LTD: 'LTD (Late transfer date)',
  APD: 'APD (Approved parole date)',
  NPD: 'NPD (Non-parole date)',
  DPRRD: 'DPRRD (Detention and training order post recall release date)',
  Tariff: 'Tariff (known as the Tariff expiry date)',
  TERSED: 'TERSED (Tariff-expired removal scheme eligibility date)',
  None: 'None of the above dates apply',
}
const order = {
  SED: 1,
  LED: 2,
  CRD: 3,
  HDCED: 4,
  TUSED: 5,
  PRRD: 6,
  PED: 7,
  ROTL: 20,
  ERSED: 21,
  ARD: 22,
  HDCAD: 23,
  MTD: 24,
  ETD: 25,
  LTD: 26,
  NPD: 27,
  DPRRD: 28,
  Tariff: 18,
  TERSED: 19,
  APD: 29,
  None: 30,
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
      text: fullStringLookup.SED,
      checked: false,
      attributes: {},
    },
    {
      value: 'LED',
      text: fullStringLookup.LED,
      checked: false,
      attributes: {},
    },
    {
      value: 'CRD',
      attributes: {},
      checked: false,
      text: fullStringLookup.CRD,
    },
    {
      attributes: {},
      checked: false,
      value: 'HDCED',
      text: fullStringLookup.HDCED,
    },
    {
      value: 'TUSED',
      attributes: {},
      checked: false,
      text: fullStringLookup.TUSED,
    },
    {
      value: 'PRRD',
      attributes: {},
      checked: false,
      text: fullStringLookup.PRRD,
    },
    {
      value: 'PED',
      attributes: {},
      checked: false,
      text: fullStringLookup.PED,
    },
    {
      value: 'ROTL',
      checked: false,
      attributes: {},
      text: fullStringLookup.ROTL,
    },
    {
      value: 'ERSED',
      attributes: {},
      checked: false,
      text: fullStringLookup.ERSED,
    },
    {
      value: 'ARD',
      attributes: {},
      checked: false,
      text: fullStringLookup.ARD,
    },
    {
      value: 'HDCAD',
      attributes: {},
      checked: false,
      text: fullStringLookup.HDCAD,
    },
    {
      value: 'MTD',
      attributes: {},
      checked: false,
      text: fullStringLookup.MTD,
    },
    {
      value: 'ETD',
      attributes: {},
      checked: false,
      text: fullStringLookup.ETD,
    },
    {
      value: 'LTD',
      attributes: {},
      checked: false,
      text: fullStringLookup.LTD,
    },
    {
      value: 'APD',
      attributes: {},
      checked: false,
      text: fullStringLookup.APD,
    },
    {
      value: 'NPD',
      attributes: {},
      checked: false,
      text: fullStringLookup.NPD,
    },
    {
      value: 'DPRRD',
      attributes: {},
      checked: false,
      text: fullStringLookup.DPRRD,
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
      text: fullStringLookup.Tariff,
    },
    {
      value: 'TERSED',
      attributes: {},
      checked: false,
      text: fullStringLookup.TERSED,
    },
    {
      value: 'ROTL',
      attributes: {},
      checked: false,
      text: fullStringLookup.ROTL,
    },
    {
      value: 'APD',
      attributes: {},
      checked: false,
      text: fullStringLookup.APD,
    },
    {
      divider: 'or',
    },
    {
      value: 'None',
      text: fullStringLookup.None,
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
        const message = 'The date entered must include a day, month and a year.'
        return this.allErrored(req, nomsId, enteredDate, allItems, message)
      }
      const someErrors = this.singleItemsErrored(req, allItems, enteredDate, nomsId)
      if (someErrors) {
        return someErrors
      }
      if (!this.isDateValid(enteredDate)) {
        return this.allErrored(req, nomsId, enteredDate, allItems, 'The date entered must be a real date')
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

  private allErrored(
    req: Request,
    nomsId: string,
    enteredDate: EnteredDate,
    allItems: DateInputItem[],
    message: string
  ) {
    const date = req.session.selectedManualEntryDates[nomsId].find(
      (d: ManualEntrySelectedDate) => d.dateType === enteredDate.dateType
    )
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
      message += '.'
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
    return req.session.selectedManualEntryDates[nomsId]
      .map((d: ManualEntrySelectedDate) => {
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
          order: this.getOrder(d.dateType),
        }
      })
      .sort((row1: DateRow, row2: DateRow) => row1.order - row2.order)
  }

  private getOrder(dateType: string) {
    return order[dateType]
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

export interface DateRow {
  key: string
  value: string
  actions: ActionItem
  order: number
}

export interface ActionItem {
  href: string
  text: string
  visuallyHiddenText: string
}

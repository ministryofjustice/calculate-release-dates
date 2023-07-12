import { Request } from 'express'
import { DateTime } from 'luxon'
import { ManualEntrySelectedDate } from '../models/ManualEntrySelectedDate'
import ManualEntryValidationService from './manualEntryValidationService'
import DateTypeConfigurationService, { FULL_STRING_LOOKUP } from './dateTypeConfigurationService'
import DateValidationService, { DateInputItem, EnteredDate, StorageResponseModel } from './dateValidationService'

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
      text: FULL_STRING_LOOKUP.SED,
      checked: false,
      attributes: {},
    },
    {
      value: 'LED',
      text: FULL_STRING_LOOKUP.LED,
      checked: false,
      attributes: {},
    },
    {
      value: 'CRD',
      attributes: {},
      checked: false,
      text: FULL_STRING_LOOKUP.CRD,
    },
    {
      attributes: {},
      checked: false,
      value: 'HDCED',
      text: FULL_STRING_LOOKUP.HDCED,
    },
    {
      value: 'TUSED',
      attributes: {},
      checked: false,
      text: FULL_STRING_LOOKUP.TUSED,
    },
    {
      value: 'PRRD',
      attributes: {},
      checked: false,
      text: FULL_STRING_LOOKUP.PRRD,
    },
    {
      value: 'PED',
      attributes: {},
      checked: false,
      text: FULL_STRING_LOOKUP.PED,
    },
    {
      value: 'ROTL',
      checked: false,
      attributes: {},
      text: FULL_STRING_LOOKUP.ROTL,
    },
    {
      value: 'ERSED',
      attributes: {},
      checked: false,
      text: FULL_STRING_LOOKUP.ERSED,
    },
    {
      value: 'ARD',
      attributes: {},
      checked: false,
      text: FULL_STRING_LOOKUP.ARD,
    },
    {
      value: 'HDCAD',
      attributes: {},
      checked: false,
      text: FULL_STRING_LOOKUP.HDCAD,
    },
    {
      value: 'MTD',
      attributes: {},
      checked: false,
      text: FULL_STRING_LOOKUP.MTD,
    },
    {
      value: 'ETD',
      attributes: {},
      checked: false,
      text: FULL_STRING_LOOKUP.ETD,
    },
    {
      value: 'LTD',
      attributes: {},
      checked: false,
      text: FULL_STRING_LOOKUP.LTD,
    },
    {
      value: 'APD',
      attributes: {},
      checked: false,
      text: FULL_STRING_LOOKUP.APD,
    },
    {
      value: 'NPD',
      attributes: {},
      checked: false,
      text: FULL_STRING_LOOKUP.NPD,
    },
    {
      value: 'DPRRD',
      attributes: {},
      checked: false,
      text: FULL_STRING_LOOKUP.DPRRD,
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
      text: FULL_STRING_LOOKUP.Tariff,
    },
    {
      value: 'TERSED',
      attributes: {},
      checked: false,
      text: FULL_STRING_LOOKUP.TERSED,
    },
    {
      value: 'ROTL',
      attributes: {},
      checked: false,
      text: FULL_STRING_LOOKUP.ROTL,
    },
    {
      value: 'APD',
      attributes: {},
      checked: false,
      text: FULL_STRING_LOOKUP.APD,
    },
    {
      divider: 'or',
    },
    {
      value: 'None',
      text: FULL_STRING_LOOKUP.None,
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
  constructor(
    private readonly manualEntryValidationService: ManualEntryValidationService,
    private readonly dateTypeConfigurationService: DateTypeConfigurationService,
    private readonly dateValidationService: DateValidationService
  ) {}

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
    const dates = this.dateTypeConfigurationService.configure(
      req.body.dateSelect,
      req.session.selectedManualEntryDates[nomsId]
    )
    // Do validation here
    req.session.selectedManualEntryDates[nomsId] = [...req.session.selectedManualEntryDates[nomsId], ...dates]
  }

  public getNextDateToEnter(dates: ManualEntrySelectedDate[]): ManualEntrySelectedDate {
    const hasDateToEnter = dates.some((d: ManualEntrySelectedDate) => d !== undefined && d.date === undefined)
    if (hasDateToEnter) {
      return dates.find((d: ManualEntrySelectedDate) => d !== undefined && d.date === undefined)
    }
    return undefined
  }

  public storeDate(dates: ManualEntrySelectedDate[], enteredDate: EnteredDate): StorageResponseModel {
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
        return this.dateValidationService.allErrored(dates, enteredDate, allItems, message)
      }
      const someErrors = this.dateValidationService.singleItemsErrored(dates, allItems, enteredDate)
      if (someErrors) {
        return someErrors
      }
      if (!this.dateValidationService.isDateValid(enteredDate)) {
        return this.dateValidationService.allErrored(
          dates,
          enteredDate,
          allItems,
          'The date entered must be a real date'
        )
      }
      const notWithinOneHundredYears = this.dateValidationService.notWithinOneHundredYears(dates, enteredDate, allItems)
      if (notWithinOneHundredYears) {
        return notWithinOneHundredYears
      }
      const date = dates.find((d: ManualEntrySelectedDate) => d.dateType === enteredDate.dateType)
      date.date = enteredDate
      return { success: true, isNone: false, date } as StorageResponseModel
    }
    return { success: false, isNone: true } as StorageResponseModel
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
        const text = FULL_STRING_LOOKUP[d.dateType]
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
    return FULL_STRING_LOOKUP[dateType]
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
      dateText: FULL_STRING_LOOKUP[<string>req.query.dateType],
      date: undefined,
    } as ManualEntrySelectedDate)
    return date
  }
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

import { Request } from 'express'
import { DateTime } from 'luxon'
import DateTypeConfigurationService from './dateTypeConfigurationService'
import DateValidationService, { DateInputItem, EnteredDate, StorageResponseModel } from './dateValidationService'
import CalculateReleaseDatesService from './calculateReleaseDatesService'
import {
  ManualEntrySelectedDate,
  SubmittedDate,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { createSupportLink } from '../utils/utils'

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

const errorMessage = {
  errorMessage: {
    text: 'Select at least one release date.',
  },
}
export default class ManualEntryService {
  constructor(
    private readonly dateTypeConfigurationService: DateTypeConfigurationService,
    private readonly dateValidationService: DateValidationService,
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
  ) {
    // intentionally left blank
  }

  public async verifySelectedDateType(
    token: string,
    req: Request,
    nomsId: string,
    hasIndeterminateSentences: boolean,
    firstLoad: boolean,
  ): Promise<{ error: boolean; config: DateSelectConfiguration }> {
    if (!req.session.selectedManualEntryDates) {
      req.session.selectedManualEntryDates = {}
    }
    if (!req.session.selectedManualEntryDates[nomsId]) {
      req.session.selectedManualEntryDates[nomsId] = []
    }
    const insufficientDatesSelected =
      req.body == null ||
      (!firstLoad &&
        req.session.selectedManualEntryDates[nomsId].length === 0 &&
        (req.body.dateSelect === undefined || req.body.dateSelect.length === 0))
    let config: DateSelectConfiguration
    if (hasIndeterminateSentences) {
      config = await this.indeterminateConfig(token)
    } else {
      config = await this.determinateConfig(token)
    }
    if (insufficientDatesSelected) {
      const mergedConfig = { ...config, ...errorMessage }
      this.enrichConfiguration(mergedConfig, req, nomsId)
      return { error: true, config: mergedConfig }
    }
    const selectedDateTypes: string[] = Array.isArray(req.body.dateSelect) ? req.body.dateSelect : [req.body.dateSelect]

    const validationMessages = await this.calculateReleaseDatesService.validateDatesForManualEntry(
      token,
      selectedDateTypes,
    )

    if (validationMessages.messages.length > 0) {
      const errorStart = 'There is a problem'
      const errorEnd = createSupportLink({
        prefixText: 'You must reselect the dates, or if you need help, ',
        linkText: 'contact the Specialist support team',
        suffixText: ' for support.',
        emailSubjectText: 'Calculate release dates - Manual Entry - Incompatible Dates',
      })

      const dateErrors = `<div class="govuk-error-message">${errorStart}<ul>
      <div class="govuk-error-message"><ul>
        ${validationMessages.messages.map(e => `<li>${e.text}</li>`).join('\n')}</ul></div>
      </ul>${errorEnd}</div>`
      const validationError = { errorMessage: { html: dateErrors } }
      const mergedConfig = { ...config, ...validationError }
      this.enrichConfiguration(<DateSelectConfiguration>mergedConfig, req, nomsId)
      return { error: true, config: <DateSelectConfiguration>mergedConfig }
    }
    this.enrichConfiguration(config, req, nomsId)
    return { error: false, config: <DateSelectConfiguration>config }
  }

  private enrichConfiguration(mergedConfig: DateSelectConfiguration, req: Request, nomsId: string) {
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

  public async addManuallyCalculatedDateTypes(token: string, req: Request, nomsId: string): Promise<void> {
    const dates = await this.dateTypeConfigurationService.configureViaBackend(
      token,
      req.body.dateSelect,
      req.session.selectedManualEntryDates[nomsId],
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
          'The date entered must be a real date',
        )
      }
      const notWithinOneHundredYears = this.dateValidationService.notWithinOneHundredYears(dates, enteredDate, allItems)
      if (notWithinOneHundredYears) {
        return notWithinOneHundredYears
      }
      const date = dates.find((d: ManualEntrySelectedDate) => d.dateType === enteredDate.dateType)
      date.date = enteredDate as unknown as SubmittedDate
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

  public async getConfirmationConfiguration(token: string, req: Request, nomsId: string) {
    const dateTypeDefinitions = await this.dateTypeConfigurationService.dateTypeToDescriptionMapping(token)
    return req.session.selectedManualEntryDates[nomsId]
      .map((d: ManualEntrySelectedDate) => {
        const dateValue = this.dateString(d)
        const text = dateTypeDefinitions[d.dateType]
        const items = this.getItems(nomsId, d, text)
        return {
          key: {
            text,
          },
          value: {
            text: dateValue,
            classes: [`manual-entry-value-for-${d.dateType}`],
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
        text: 'Edit',
        visuallyHiddenText: `Change ${text}`,
        attributes: { 'data-qa': `change-manual-date-${d.dateType}` },
      },
      {
        href: `/calculation/${nomsId}/manual-entry/remove-date?dateType=${d.dateType}`,
        text: 'Remove',
        visuallyHiddenText: `Remove ${text}`,
        attributes: { 'data-qa': `remove-manual-date-${d.dateType}` },
      },
    ]
    if (d.dateType === 'None') {
      return items.filter(it => it.text !== 'Change')
    }
    return items
  }

  public async fullStringLookup(token: string, dateType: string): Promise<string> {
    const def = await this.dateTypeConfigurationService.dateTypeToDescriptionMapping(token)
    return def[dateType]
  }

  public removeDate(req: Request, nomsId: string): number {
    const dateToRemove = req.query.dateType
    if (req.body != null && req.body['remove-date'] === 'yes') {
      req.session.selectedManualEntryDates[nomsId] = req.session.selectedManualEntryDates[nomsId].filter(
        (d: ManualEntrySelectedDate) => d.dateType !== dateToRemove,
      )
    }
    return req.session.selectedManualEntryDates[nomsId].length
  }

  public async changeDate(token: string, req: Request, nomsId: string): Promise<ManualEntrySelectedDate> {
    const fullString = await this.fullStringLookup(token, <string>req.query.dateType)
    const date = req.session.selectedManualEntryDates[nomsId].find(
      (d: ManualEntrySelectedDate) => d.dateType === req.query.dateType,
    )
    req.session.selectedManualEntryDates[nomsId] = req.session.selectedManualEntryDates[nomsId].filter(
      (d: ManualEntrySelectedDate) => d.dateType !== req.query.dateType,
    )
    req.session.selectedManualEntryDates[nomsId].push({
      dateType: req.query.dateType,
      dateText: fullString,
      date: undefined,
    } as ManualEntrySelectedDate)
    return date
  }

  private async determinateConfig(token: string): Promise<DateSelectConfiguration> {
    const dateTypeDefinitions = await this.dateTypeConfigurationService.dateTypeToDescriptionMapping(token)
    return {
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
          text: dateTypeDefinitions.SED,
          checked: false,
          attributes: {},
        },
        {
          value: 'LED',
          text: dateTypeDefinitions.LED,
          checked: false,
          attributes: {},
        },
        {
          value: 'CRD',
          attributes: {},
          checked: false,
          text: dateTypeDefinitions.CRD,
        },
        {
          attributes: {},
          checked: false,
          value: 'HDCED',
          text: dateTypeDefinitions.HDCED,
        },
        {
          value: 'TUSED',
          attributes: {},
          checked: false,
          text: dateTypeDefinitions.TUSED,
        },
        {
          value: 'PRRD',
          attributes: {},
          checked: false,
          text: dateTypeDefinitions.PRRD,
        },
        {
          value: 'PED',
          attributes: {},
          checked: false,
          text: dateTypeDefinitions.PED,
        },
        {
          value: 'ROTL',
          checked: false,
          attributes: {},
          text: dateTypeDefinitions.ROTL,
        },
        {
          value: 'ERSED',
          attributes: {},
          checked: false,
          text: dateTypeDefinitions.ERSED,
        },
        {
          value: 'ARD',
          attributes: {},
          checked: false,
          text: dateTypeDefinitions.ARD,
        },
        {
          value: 'HDCAD',
          attributes: {},
          checked: false,
          text: dateTypeDefinitions.HDCAD,
        },
        {
          value: 'MTD',
          attributes: {},
          checked: false,
          text: dateTypeDefinitions.MTD,
        },
        {
          value: 'ETD',
          attributes: {},
          checked: false,
          text: dateTypeDefinitions.ETD,
        },
        {
          value: 'LTD',
          attributes: {},
          checked: false,
          text: dateTypeDefinitions.LTD,
        },
        {
          value: 'APD',
          attributes: {},
          checked: false,
          text: dateTypeDefinitions.APD,
        },
        {
          value: 'NPD',
          attributes: {},
          checked: false,
          text: dateTypeDefinitions.NPD,
        },
        {
          value: 'DPRRD',
          attributes: {},
          checked: false,
          text: dateTypeDefinitions.DPRRD,
        },
      ],
    } as DateSelectConfiguration
  }

  private async indeterminateConfig(token: string): Promise<DateSelectConfiguration> {
    const dateTypeDefinitions = await this.dateTypeConfigurationService.dateTypeToDescriptionMapping(token)
    return {
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
          text: dateTypeDefinitions.Tariff,
        },
        {
          value: 'TERSED',
          attributes: {},
          checked: false,
          text: dateTypeDefinitions.TERSED,
        },
        {
          value: 'ROTL',
          attributes: {},
          checked: false,
          text: dateTypeDefinitions.ROTL,
        },
        {
          value: 'APD',
          attributes: {},
          checked: false,
          text: dateTypeDefinitions.APD,
        },
        {
          value: 'PED',
          attributes: {},
          checked: false,
          text: dateTypeDefinitions.PED,
        },
        {
          divider: 'or',
        },
        {
          value: 'None',
          text: dateTypeDefinitions.None,
          attributes: {},
          checked: false,
          behaviour: 'exclusive',
        },
      ],
    } as DateSelectConfiguration
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

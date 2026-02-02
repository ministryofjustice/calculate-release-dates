import { Request } from 'express'
import { DateTime } from 'luxon'
import DateTypeConfigurationService from './dateTypeConfigurationService'
import DateValidationService, { DateInputItem, EnteredDate, StorageResponseModel } from './dateValidationService'
import CalculateReleaseDatesService from './calculateReleaseDatesService'
import { DetailedDate } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { createSupportLink } from '../utils/utils'
import { ManualEntrySelectedDate, ManualJourneySelectedDate } from '../types/ManualJourney'
import releaseDateType from '../enumerations/releaseDateType'

export const dateTypeOrder = {
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

export const determinateDateTypesForManualEntry = [
  'SED',
  'LED',
  'CRD',
  'HDCED',
  'TUSED',
  'PRRD',
  'PED',
  'ROTL',
  'ERSED',
  'ARD',
  'HDCAD',
  'MTD',
  'ETD',
  'LTD',
  'APD',
  'NPD',
  'DPRRD',
]

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

  public populateExistingDates(req: Request, nomsId: string, dates: DetailedDate[]) {
    if (!req.session.selectedManualEntryDates[nomsId]) {
      req.session.selectedManualEntryDates[nomsId] = new Array<ManualJourneySelectedDate>()
    }
    req.session.selectedManualEntryDates[nomsId] = dates
      .filter(d => d.date)
      .map(({ type, description, date }, i): ManualJourneySelectedDate => {
        const { day, month, year } = DateTime.fromISO(date)
        return {
          position: i + 1,
          completed: true,
          dateType: type,
          manualEntrySelectedDate: {
            dateType: type,
            dateText: description,
            date: { day, month, year },
          },
        }
      })
  }

  public async verifySelectedDateType(
    req: Request,
    nomsId: string,
    hasIndeterminateSentences: boolean,
    firstLoad: boolean,
    existingDateTypes: string[],
    username: string,
  ): Promise<{ error: boolean; config: DateSelectConfiguration }> {
    if (!req.session.selectedManualEntryDates) {
      req.session.selectedManualEntryDates = {}
    }
    if (!req.session.selectedManualEntryDates[nomsId]) {
      req.session.selectedManualEntryDates[nomsId] = []
    }

    const newDates = req.session.selectedManualEntryDates[nomsId].filter(
      (existingDate: ManualJourneySelectedDate) => !existingDate.completed,
    )

    const insufficientDatesSelected =
      req.body == null ||
      (!firstLoad && newDates.length === 0 && (req.body.dateSelect === undefined || req.body.dateSelect.length === 0))

    let config: DateSelectConfiguration
    if (hasIndeterminateSentences) {
      config = await this.indeterminateConfig(username, existingDateTypes)
    } else {
      config = await this.determinateConfig(username, existingDateTypes)
    }

    if (insufficientDatesSelected) {
      const mergedConfig = { ...config, ...errorMessage }
      this.enrichConfiguration(mergedConfig, req, nomsId, existingDateTypes)
      return { error: true, config: mergedConfig }
    }
    const selectedDateTypes: string[] = Array.isArray(req.body.dateSelect) ? req.body.dateSelect : [req.body.dateSelect]

    const validationMessages = await this.calculateReleaseDatesService.validateDatesForManualEntry(
      username,
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
      this.enrichConfiguration(<DateSelectConfiguration>mergedConfig, req, nomsId, existingDateTypes)
      return { error: true, config: <DateSelectConfiguration>mergedConfig }
    }
    this.enrichConfiguration(config, req, nomsId, existingDateTypes)
    return { error: false, config: <DateSelectConfiguration>config }
  }

  private enrichConfiguration(
    mergedConfig: DateSelectConfiguration,
    req: Request,
    nomsId: string,
    existingDateTypes: string[],
  ) {
    for (const item of mergedConfig.items) {
      if (
        req.session.selectedManualEntryDates[nomsId] &&
        req.session.selectedManualEntryDates[nomsId].some((d: ManualJourneySelectedDate) => d.dateType === item.value)
      ) {
        item.checked = true
        item.attributes = existingDateTypes.includes(item.value) ? { disabled: true } : {}
      } else {
        item.checked = false
        item.attributes = {}
      }
    }
  }

  public async addManuallyCalculatedDateTypes(username: string, req: Request, nomsId: string): Promise<void> {
    const dateTypeDefinitions = await this.calculateReleaseDatesService.getDateTypeDefinitions(username)
    const selectedDateTypes: string[] = Array.isArray(req.body.dateSelect) ? req.body.dateSelect : [req.body.dateSelect]

    const currentDates: ManualJourneySelectedDate[] = req.session.selectedManualEntryDates[nomsId] || []

    const immutableDates: ManualJourneySelectedDate[] = []
    const existingMutableDates: ManualJourneySelectedDate[] = []

    for (const date of currentDates) {
      if (date.completed) {
        immutableDates.push(date)
      } else if (selectedDateTypes.includes(date.dateType)) {
        existingMutableDates.push(date)
      }
    }

    let positionCounter = 1

    const positionedImmutableDates = immutableDates.map(d => {
      const updated = { ...d, position: positionCounter }
      positionCounter += 1
      return updated
    })

    const positionedExistingMutableDates = existingMutableDates.map(d => {
      const updated = { ...d, position: positionCounter }
      positionCounter += 1
      return updated
    })

    const existingTypes = new Set([
      ...positionedImmutableDates.map(d => d.dateType),
      ...positionedExistingMutableDates.map(d => d.dateType),
    ])

    const newMutableDates: ManualJourneySelectedDate[] = selectedDateTypes
      .filter(dateType => !existingTypes.has(dateType))
      .map(dateType => {
        const newDate: ManualJourneySelectedDate = {
          position: positionCounter,
          completed: false,
          dateType,
          manualEntrySelectedDate: {
            date: undefined,
            dateType: dateType as releaseDateType,
            dateText: this.dateTypeConfigurationService.getDescription(dateTypeDefinitions, dateType),
          },
        }
        positionCounter += 1
        return newDate
      })

    req.session.selectedManualEntryDates[nomsId] = [
      ...positionedImmutableDates,
      ...positionedExistingMutableDates,
      ...newMutableDates,
    ]
  }

  public getDateByType(outstandingDates: ManualJourneySelectedDate[], dateType: string) {
    if (!Array.isArray(outstandingDates) || outstandingDates.length === 0) {
      return undefined
    }

    return outstandingDates.find(d => d.manualEntrySelectedDate.dateType === dateType)
  }

  public getNextDateToEnter(
    outstandingDates: ManualJourneySelectedDate[],
    currentDateType?: string,
  ): ManualJourneySelectedDate {
    if (!Array.isArray(outstandingDates) || outstandingDates.length === 0) {
      return undefined
    }

    const sortedDates = outstandingDates.sort((a, b) => a.position - b.position)

    if (currentDateType) {
      const currentDate = sortedDates.find(d => d.dateType === currentDateType)
      if (currentDate) {
        return sortedDates.find(d => d.position === currentDate.position + 1)
      }
    }

    return sortedDates.find(d => !d.completed && !d.manualEntrySelectedDate?.date)
  }

  public getPreviousDate(outstandingDates: ManualJourneySelectedDate[], currentDate: ManualJourneySelectedDate) {
    if (!Array.isArray(outstandingDates) || outstandingDates.length === 0) {
      return undefined
    }

    const previousDate = outstandingDates.find(d => d.position === currentDate.position - 1 && !d.completed)
    return previousDate ? previousDate.manualEntrySelectedDate : undefined
  }

  public getPreviousDateByType(outstandingDates: ManualJourneySelectedDate[], dateType: string) {
    if (!Array.isArray(outstandingDates) || outstandingDates.length === 0) {
      return undefined
    }

    const previousDate = outstandingDates.find(d => d.dateType === dateType)
    return previousDate ? previousDate.manualEntrySelectedDate : undefined
  }

  public storeDate(manualDates: ManualJourneySelectedDate[], enteredDate: EnteredDate): StorageResponseModel {
    if (enteredDate.dateType === 'None') {
      return { success: false, date: undefined, enteredDate: undefined, items: [], message: '', isNone: true }
    }

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
      return this.dateValidationService.allErrored(manualDates, enteredDate, allItems, message)
    }

    const someErrors = this.dateValidationService.singleItemsErrored(manualDates, allItems, enteredDate)
    if (someErrors) {
      return someErrors
    }

    if (!this.dateValidationService.isDateValid(enteredDate)) {
      return this.dateValidationService.allErrored(
        manualDates,
        enteredDate,
        allItems,
        'The date entered must be a real date',
      )
    }

    const notWithinOneHundredYears = this.dateValidationService.notWithinOneHundredYears(
      manualDates,
      enteredDate,
      allItems,
    )
    if (notWithinOneHundredYears) {
      return notWithinOneHundredYears
    }

    const manualDate = manualDates.find((d: ManualJourneySelectedDate) => d.dateType === enteredDate.dateType)
    const manualEntry = manualDate.manualEntrySelectedDate
    manualDate.manualEntrySelectedDate.date = {
      day: Number(enteredDate.day),
      month: Number(enteredDate.month),
      year: Number(enteredDate.year),
    }

    return { enteredDate: undefined, items: [], message: undefined, success: true, isNone: false, date: manualEntry }
  }

  private dateString(selectedDate: ManualEntrySelectedDate): string {
    if (selectedDate.dateType === 'None') {
      return ''
    }
    const dateString = `${selectedDate.date.year}-${selectedDate.date.month}-${selectedDate.date.day}`
    return DateTime.fromFormat(dateString, 'yyyy-M-d').toFormat('dd MMMM yyyy')
  }

  public async getConfirmationConfiguration(
    username: string,
    req: Request,
    nomsId: string,
    allowActions: boolean,
  ): Promise<ManualJourneySelectedDate[]> {
    const dateTypeDefinitions = await this.dateTypeConfigurationService.dateTypeToDescriptionMapping(username)
    return req.session.selectedManualEntryDates[nomsId]
      .map((d: ManualJourneySelectedDate) => {
        const dateValue = this.dateString(d.manualEntrySelectedDate)
        const text = dateTypeDefinitions[d.dateType]
        const items = allowActions ? this.getItems(nomsId, d.manualEntrySelectedDate, text) : null
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
    return dateTypeOrder[dateType]
  }

  private getItems(nomsId: string, d: ManualEntrySelectedDate, text: string) {
    const items = [
      {
        href: `/calculation/${nomsId}/manual-entry/enter-date?dateType=${d.dateType}`,
        text: 'Edit',
        visuallyHiddenText: `Change ${text}`,
        attributes: { 'data-qa': `change-manual-date-${d.dateType}` },
      },
      {
        href: `/calculation/${nomsId}/manual-entry/remove-date?dateType=${d.dateType}`,
        text: 'Delete',
        visuallyHiddenText: `Delete ${text}`,
        attributes: { 'data-qa': `remove-manual-date-${d.dateType}` },
      },
    ]
    if (d.dateType === 'None') {
      return items.filter(it => it.text !== 'Change')
    }
    return items
  }

  public async fullStringLookup(username: string, dateType: string): Promise<string> {
    const def = await this.dateTypeConfigurationService.dateTypeToDescriptionMapping(username)
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

  private async determinateConfig(username: string, existingTypes: string[]): Promise<DateSelectConfiguration> {
    const dateTypeDefinitions = await this.dateTypeConfigurationService.dateTypeToDescriptionMapping(username)
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
      items: determinateDateTypesForManualEntry.map(dateType => {
        return {
          value: dateType,
          text: dateTypeDefinitions[dateType],
          checked: false,
          attributes: { disabled: existingTypes.includes(dateType) },
        }
      }),
    } as DateSelectConfiguration
  }

  private async indeterminateConfig(username: string, existingTypes: string[]): Promise<DateSelectConfiguration> {
    const dateTypeDefinitions = await this.dateTypeConfigurationService.dateTypeToDescriptionMapping(username)
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
          attributes: { disabled: existingTypes.includes(dateTypeDefinitions.Tariff) },
          checked: false,
          text: dateTypeDefinitions.Tariff,
        },
        {
          value: 'TERSED',
          attributes: { disabled: existingTypes.includes(dateTypeDefinitions.TERSED) },
          checked: false,
          text: dateTypeDefinitions.TERSED,
        },
        {
          value: 'ROTL',
          attributes: { disabled: existingTypes.includes(dateTypeDefinitions.ROTL) },
          checked: false,
          text: dateTypeDefinitions.ROTL,
        },
        {
          value: 'APD',
          attributes: { disabled: existingTypes.includes(dateTypeDefinitions.APD) },
          checked: false,
          text: dateTypeDefinitions.APD,
        },
        {
          value: 'PED',
          attributes: { disabled: existingTypes.includes(dateTypeDefinitions.PED) },
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
  items: SelectedDateCheckBox[]
}

export interface SelectedDateCheckBox {
  divider?: string
  checked?: boolean
  attributes?: { disabled?: boolean }
  behaviour?: string
  text?: string
  value?: string
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

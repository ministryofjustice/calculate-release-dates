import { DateTime } from 'luxon'
import { ManualEntrySelectedDate } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

export default class DateValidationService {
  public isDateValid(enteredDate: EnteredDate): boolean {
    const dateAsDate = DateTime.fromFormat(`${enteredDate.year}-${enteredDate.month}-${enteredDate.day}`, 'yyyy-M-d')
    return dateAsDate.isValid
  }

  public allErrored(
    dates: ManualEntrySelectedDate[],
    enteredDate: EnteredDate,
    allItems: DateInputItem[],
    message: string,
  ) {
    const date = dates.find((d: ManualEntrySelectedDate) => d.dateType === enteredDate.dateType)
    const items = allItems.map(it => {
      return { ...it, classes: `${it.classes} govuk-input--error` }
    })
    return { message, date, enteredDate, success: false, items, isNone: false } as StorageResponseModel
  }

  public notWithinOneHundredYears(
    dates: ManualEntrySelectedDate[],
    enteredDate: EnteredDate,
    allItems: DateInputItem[],
  ) {
    const date = dates.find((d: ManualEntrySelectedDate) => d.dateType === enteredDate.dateType)
    const dateAsDate = DateTime.fromFormat(`${enteredDate.year}-${enteredDate.month}-${enteredDate.day}`, 'yyyy-M-d')
    const now = DateTime.now()
    const oneHundredYearsBefore = now.minus({ years: 100 })
    const oneHundredYearsAfter = now.plus({ years: 100 })
    if (dateAsDate < oneHundredYearsBefore || dateAsDate > oneHundredYearsAfter) {
      const message = `The date entered must be between ${oneHundredYearsBefore.toFormat(
        'dd MM yyyy',
      )} and ${oneHundredYearsAfter.toFormat('dd MM yyyy')}`
      const items = allItems.map(it => {
        return { ...it, classes: `${it.classes} govuk-input--error` }
      })
      return { message, date, enteredDate, success: false, items, isNone: false } as StorageResponseModel
    }
    return undefined
  }

  public singleItemsErrored(
    dates: ManualEntrySelectedDate[],
    allItems: DateInputItem[],
    enteredDate: EnteredDate,
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
      const date = dates.find((d: ManualEntrySelectedDate) => d.dateType === enteredDate.dateType)
      message += '.'
      return { message, date, enteredDate, success: false, items, isNone: false } as StorageResponseModel
    }
    return undefined
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

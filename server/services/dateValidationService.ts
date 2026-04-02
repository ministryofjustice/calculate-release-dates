import { DateTime } from 'luxon'
import { ManualEntrySelectedDate, ManualJourneySelectedDate } from '../types/ManualJourney'
import { GenuineOverrideInputs } from '../@types/journeys'
import { dateToDayMonthYear } from '../utils/utils'

export default class DateValidationService {
  public createDateTime({
    day,
    month,
    year,
  }: {
    day: string | number
    month: string | number
    year: string | number
  }): DateTime {
    return DateTime.fromObject({
      day: Number(day),
      month: Number(month),
      year: Number(year),
    })
  }

  public findDateByType(
    type: string,
    manualDates: ManualJourneySelectedDate[],
    genuineOverrideInputs: GenuineOverrideInputs,
  ): { day: number; month: number; year: number } | null {
    let storedDate = null
    if (manualDates) {
      storedDate = manualDates.find(d => d.dateType === type)?.manualEntrySelectedDate?.date
    } else if (genuineOverrideInputs) {
      const goDateToSave = genuineOverrideInputs.datesToSave.find(d => d.type === type)?.date
      if (typeof goDateToSave === 'string') {
        storedDate = dateToDayMonthYear(goDateToSave)
      } else if (genuineOverrideInputs.datesBeingAdded?.length > 0) {
        const goDateToAdd = genuineOverrideInputs.datesBeingAdded.find(d => d.type === type)
        if (goDateToAdd && goDateToAdd.day && goDateToAdd.month && goDateToAdd.year) {
          storedDate = {
            day: Number(goDateToAdd.day),
            month: Number(goDateToAdd.month),
            year: Number(goDateToAdd.year),
          }
        }
      }
    }
    return storedDate
  }

  public validateEtdMtdLtdDprrdDate(
    enteredDate: EnteredDate,
    manualDates: ManualJourneySelectedDate[],
    genuineOverrideInputs: GenuineOverrideInputs,
  ): string {
    const dateFormat = 'dd/MM/yyyy'
    const enteredDateType = enteredDate.dateType

    const inputDate = this.createDateTime(enteredDate)
    const findDateByType = (type: string) => this.findDateByType(type, manualDates, genuineOverrideInputs)

    if (enteredDateType === 'ETD') {
      const mtdDate = findDateByType('MTD')
      const ltdDate = findDateByType('LTD')
      const dprrdDate = findDateByType('DPRRD')
      if (mtdDate) {
        const mtdDateTime = this.createDateTime(mtdDate)
        if (inputDate >= mtdDateTime) {
          return `The ETD must be before the MTD, which is ${mtdDateTime.toFormat(dateFormat)}`
        }
      }
      if (ltdDate) {
        const ltdDateTime = this.createDateTime(ltdDate)
        if (inputDate >= ltdDateTime) {
          return `The ETD must be before the LTD, which is ${ltdDateTime.toFormat(dateFormat)}`
        }
      }
      if (dprrdDate) {
        const dprrdDateTime = this.createDateTime(dprrdDate)
        if (inputDate >= dprrdDateTime) {
          return `The ETD must be before the DPRRD, which is ${dprrdDateTime.toFormat(dateFormat)}`
        }
      }
    } else if (enteredDateType === 'MTD') {
      const etdDate = findDateByType('ETD')
      const ltdDate = findDateByType('LTD')
      const dprrdDate = findDateByType('DPRRD')
      if (etdDate) {
        const etdDateTime = this.createDateTime(etdDate)
        if (inputDate <= etdDateTime) {
          return `The MTD must be after the ETD, which is ${etdDateTime.toFormat(dateFormat)}`
        }
      }
      if (ltdDate) {
        const ltdDateTime = this.createDateTime(ltdDate)
        if (inputDate >= ltdDateTime) {
          return `The MTD must be before the LTD, which is ${ltdDateTime.toFormat(dateFormat)}`
        }
      }
      if (dprrdDate) {
        const dprrdDateTime = this.createDateTime(dprrdDate)
        if (inputDate >= dprrdDateTime) {
          return `The MTD must be before the DPRRD, which is ${dprrdDateTime.toFormat(dateFormat)}`
        }
      }
    } else if (enteredDateType === 'LTD') {
      const etdDate = findDateByType('ETD')
      const mtdDate = findDateByType('MTD')
      const dprrdDate = findDateByType('DPRRD')
      if (etdDate) {
        const etdDateTime = this.createDateTime(etdDate)
        if (inputDate <= etdDateTime) {
          return `The LTD must be after the ETD, which is ${etdDateTime.toFormat(dateFormat)}`
        }
      }
      if (mtdDate) {
        const mtdDateTime = this.createDateTime(mtdDate)
        if (inputDate <= mtdDateTime) {
          return `The LTD must be after the MTD, which is ${mtdDateTime.toFormat(dateFormat)}`
        }
      }
      if (dprrdDate) {
        const dprrdDateTime = this.createDateTime(dprrdDate)
        if (inputDate >= dprrdDateTime) {
          return `The LTD must be before the DPRRD, which is ${dprrdDateTime.toFormat(dateFormat)}`
        }
      }
    } else if (enteredDateType === 'DPRRD') {
      const etdDate = findDateByType('ETD')
      const mtdDate = findDateByType('MTD')
      const ltdDate = findDateByType('LTD')
      if (etdDate) {
        const etdDateTime = this.createDateTime(etdDate)
        if (inputDate <= etdDateTime) {
          return `The DPRRD must be after the ETD, which is ${etdDateTime.toFormat(dateFormat)}`
        }
      }
      if (mtdDate) {
        const mtdDateTime = this.createDateTime(mtdDate)
        if (inputDate <= mtdDateTime) {
          return `The DPRRD must be after the MTD, which is ${mtdDateTime.toFormat(dateFormat)}`
        }
      }
      if (ltdDate) {
        const ltdDateTime = this.createDateTime(ltdDate)
        if (inputDate <= ltdDateTime) {
          return `The DPRRD must be after the LTD, which is ${ltdDateTime.toFormat(dateFormat)}`
        }
      }
    }

    return ''
  }

  public validateHdcadHdcedCrdDate(
    enteredDate: EnteredDate,
    manualDates: ManualJourneySelectedDate[],
    genuineOverrideInputs: GenuineOverrideInputs,
  ): string {
    const dateFormat = 'dd/MM/yyyy'
    const enteredDateType = enteredDate.dateType

    const inputDate = this.createDateTime(enteredDate)
    const findDateByType = (type: string) => this.findDateByType(type, manualDates, genuineOverrideInputs)

    const message = ''

    if (enteredDateType === 'HDCED') {
      const hdcadDate = findDateByType('HDCAD')
      const crdDate = findDateByType('CRD')
      if (hdcadDate) {
        const hdcadDateTime = this.createDateTime(hdcadDate)
        if (hdcadDateTime < inputDate) {
          return `The HDCED must be on or before the HDCAD, which is ${hdcadDateTime.toFormat(dateFormat)}`
        }
      }
      if (crdDate) {
        const crdDateTime = this.createDateTime(crdDate)
        if (inputDate >= crdDateTime) {
          return `The HDCED must be before the CRD, which is ${crdDateTime.toFormat(dateFormat)}`
        }
      }
    } else if (enteredDateType === 'HDCAD') {
      const hdcedDate = findDateByType('HDCED')
      const crdDate = findDateByType('CRD')
      if (hdcedDate) {
        const hdcedDateTime = this.createDateTime(hdcedDate)
        if (inputDate < hdcedDateTime) {
          return `The HDCAD must be on or after the HDCED, which is ${hdcedDateTime.toFormat(dateFormat)}`
        }
      }
      if (crdDate) {
        const crdDateTime = this.createDateTime(crdDate)
        if (inputDate >= crdDateTime) {
          return `The HDCAD must be before the CRD, which is ${crdDateTime.toFormat(dateFormat)}`
        }
      }
    } else if (enteredDateType === 'CRD') {
      const hdcadDate = findDateByType('HDCAD')
      const hdcedDate = findDateByType('HDCED')
      if (hdcedDate) {
        const hdcedDateTime = this.createDateTime(hdcedDate)
        if (inputDate <= hdcedDateTime) {
          return `The CRD must be after the HDCED, which is ${hdcedDateTime.toFormat(dateFormat)}`
        }
      }
      if (hdcadDate) {
        const hdcadDateTime = this.createDateTime(hdcadDate)
        if (inputDate <= hdcadDateTime) {
          return `The CRD must be after the HDCAD, which is ${hdcadDateTime.toFormat(dateFormat)}`
        }
      }
    }

    return message
  }

  public validateSedLedCrdDates(
    enteredDate: EnteredDate,
    manualDates: ManualJourneySelectedDate[],
    genuineOverrideInputs: GenuineOverrideInputs,
  ): string {
    const dateFormat = 'dd/MM/yyyy'
    const enteredDateType = enteredDate.dateType

    const inputDate = this.createDateTime(enteredDate)
    const findDateByType = (type: string) => this.findDateByType(type, manualDates, genuineOverrideInputs)

    const message = ''
    if (enteredDateType === 'LED') {
      const sedDate = findDateByType('SED')
      const crdDate = findDateByType('CRD')
      if (sedDate) {
        const sedDateTime = this.createDateTime(sedDate)
        if (inputDate > sedDateTime) {
          return `The LED must be on or before the SED, which is ${sedDateTime.toFormat(dateFormat)}`
        }
      }
      if (crdDate) {
        const crdDateTime = this.createDateTime(crdDate)
        if (inputDate < crdDateTime) {
          return `The LED must be on or after the CRD, which is ${crdDateTime.toFormat(dateFormat)}`
        }
      }
    } else if (enteredDateType === 'SED') {
      const ledDate = findDateByType('LED')
      const crdDate = findDateByType('CRD')
      if (ledDate) {
        const ledDateTime = this.createDateTime(ledDate)
        if (inputDate < ledDateTime) {
          return `The SED must be on or after the LED, which is ${ledDateTime.toFormat(dateFormat)}`
        }
      }
      if (crdDate) {
        const crdDateTime = this.createDateTime(crdDate)
        if (inputDate < crdDateTime) {
          return `The SED must be on or after the CRD, which is ${crdDateTime.toFormat(dateFormat)}`
        }
      }
    } else if (enteredDateType === 'CRD') {
      const sedDate = findDateByType('SED')
      const ledDate = findDateByType('LED')
      if (ledDate) {
        const ledDateTime = this.createDateTime(ledDate)
        if (inputDate > ledDateTime) {
          return `The CRD must be on or before the LED, which is ${ledDateTime.toFormat(dateFormat)}`
        }
      }
      if (sedDate) {
        const sedDateTime = this.createDateTime(sedDate)
        if (inputDate > sedDateTime) {
          return `The CRD must be on or before the SED, which is ${sedDateTime.toFormat(dateFormat)}`
        }
      }
    }
    return message
  }

  public validateAgainstOtherDates(
    manualDates: ManualJourneySelectedDate[],
    enteredDate: EnteredDate,
    allItems: DateInputItem[],
  ): StorageResponseModel {
    const items = allItems.map(it => {
      return { ...it, classes: `${it.classes} govuk-input--error` }
    })
    const manualDate = manualDates.find((d: ManualJourneySelectedDate) => d.dateType === enteredDate.dateType)
    const { manualEntrySelectedDate } = manualDate

    const messageForSedLedCrdDate = this.validateSedLedCrdDates(enteredDate, manualDates, null)
    if (messageForSedLedCrdDate) {
      return {
        message: messageForSedLedCrdDate,
        date: manualEntrySelectedDate,
        enteredDate,
        success: false,
        items,
        isNone: false,
      } as StorageResponseModel
    }

    const messageHdcedHdcadCrdDate = this.validateHdcadHdcedCrdDate(enteredDate, manualDates, null)
    if (messageHdcedHdcadCrdDate) {
      return {
        message: messageHdcedHdcadCrdDate,
        date: manualEntrySelectedDate,
        enteredDate,
        success: messageHdcedHdcadCrdDate === '',
        items,
        isNone: false,
      } as StorageResponseModel
    }

    const messageEtdMtdLtdDprrdDate = this.validateEtdMtdLtdDprrdDate(enteredDate, manualDates, null)
    return {
      message: messageEtdMtdLtdDprrdDate,
      date: manualEntrySelectedDate,
      enteredDate,
      success: messageEtdMtdLtdDprrdDate === '',
      items,
      isNone: false,
    } as StorageResponseModel
  }

  public isDateValid(enteredDate: EnteredDate): boolean {
    const dateAsDate = DateTime.fromFormat(`${enteredDate.year}-${enteredDate.month}-${enteredDate.day}`, 'yyyy-M-d')
    return dateAsDate.isValid
  }

  public allErrored(
    dates: ManualJourneySelectedDate[],
    enteredDate: EnteredDate,
    allItems: DateInputItem[],
    message: string,
  ) {
    const manualDate = dates.find((d: ManualJourneySelectedDate) => d.dateType === enteredDate.dateType)
    const { manualEntrySelectedDate } = manualDate
    const items = allItems.map(it => {
      return { ...it, classes: `${it.classes} govuk-input--error` }
    })
    return {
      message,
      date: manualEntrySelectedDate,
      enteredDate,
      success: false,
      items,
      isNone: false,
    } as StorageResponseModel
  }

  public notWithinOneHundredYears(
    dates: ManualJourneySelectedDate[],
    enteredDate: EnteredDate,
    allItems: DateInputItem[],
  ) {
    const manualDate = dates.find((d: ManualJourneySelectedDate) => d.dateType === enteredDate.dateType)
    const { manualEntrySelectedDate } = manualDate
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
      return {
        message,
        date: manualEntrySelectedDate,
        enteredDate,
        success: false,
        items,
        isNone: false,
      } as StorageResponseModel
    }
    return undefined
  }

  public singleItemsErrored(
    dates: ManualJourneySelectedDate[],
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
      const manualDate = dates.find((d: ManualJourneySelectedDate) => d.dateType === enteredDate.dateType)
      const { manualEntrySelectedDate } = manualDate
      message += '.'
      return {
        message,
        date: manualEntrySelectedDate,
        enteredDate,
        success: false,
        items,
        isNone: false,
      } as StorageResponseModel
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

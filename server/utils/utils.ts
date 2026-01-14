import dayjs from 'dayjs'
import { DesignSystemEnvironment } from '@ministryofjustice/hmpps-court-cases-release-dates-design/hmpps/@types'
import { AdjustmentDuration } from '../@types/calculateReleaseDates/rulesWithExtraAdjustments'
import config from '../config'
import { filteredListOfDates } from '../views/pages/components/calculation-summary-dates-card/CalculationSummaryDatesCardModel'
import { ValidationMessage } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { ErrorMessages, ErrorMessageType } from '../types/ErrorMessages'
import ErrorMessage from '../types/ErrorMessage'

const isBlank = (str: string): boolean => !str || /^\s*$/.test(str)

export const capitaliseName = (name?: string): string => {
  return isBlank(name) ? '' : name!.toLowerCase().replace(/\b[a-z]/g, letter => letter.toUpperCase())
}

export const initialiseName = (fullName?: string): string | null => {
  // this check is for the authError page
  if (!fullName) return null

  const array = fullName.split(' ')
  return `${array[0][0]}. ${array.reverse()[0]}`
}

export const groupBy = <T, K>(items: T[], groupingFunction: (item: T) => K): Map<K, T[]> => {
  return items.reduce((result, item) => {
    const key = groupingFunction(item)
    const currentValues = result.get(key) || []
    currentValues.push(item)
    result.set(key, currentValues)
    return result
  }, new Map<K, T[]>())
}

export const indexBy = <T, K>(items: T[], groupingFunction: (item: T) => K): Map<K, T> => {
  return items.reduce((result, item) => {
    const key = groupingFunction(item)
    result.set(key, item)
    return result
  }, new Map<K, T>())
}

export const longDateFormat = (dateString: string): string => dayjs(dateString).format('DD MMMM YYYY')

function pluraliseDuration(values: number, units = 'DAYS') {
  return values !== 1 ? units.toLowerCase() : units.toLowerCase().slice(0, -1)
}

export const arithmeticToWords = (adjustmentDuration: AdjustmentDuration): string => {
  const { adjustmentValue, type } = adjustmentDuration
  return adjustmentValue < 0
    ? `minus ${Math.abs(adjustmentValue)} ${pluraliseDuration(Math.abs(adjustmentValue), type)}`
    : `plus ${Math.abs(adjustmentValue)} ${pluraliseDuration(Math.abs(adjustmentValue), type)}`
}

export const daysArithmeticToWords = (n: number): string =>
  n < 0
    ? `minus ${Math.abs(n)} ${pluraliseDuration(Math.abs(n))}`
    : `plus ${Math.abs(n)} ${pluraliseDuration(Math.abs(n))}`

export const hmppsDesignSystemsEnvironmentName = (
  envName: string = config.environmentName,
): DesignSystemEnvironment => {
  if (envName === 'LOCAL') {
    return 'local'
  }
  if (envName === 'DEV') {
    return 'dev'
  }
  if (envName === 'PRE-PRODUCTION') {
    return 'pre'
  }
  return 'prod'
}

export const validPreCalcHints = (hints: [{ html: string }]) =>
  hints.filter(h => !h.html.includes('Manually overridden'))

export type EmailLinkOptions = {
  emailAddress?: string
  linkText: string
  emailSubjectText?: string
  prefixText?: string
  suffixText?: string
}

export function createSupportLink({
  linkText,
  prefixText = '',
  suffixText = '',
  emailAddress = 'omu.specialistsupportteam@justice.gov.uk',
  emailSubjectText,
}: EmailLinkOptions): string {
  const subjectPart = emailSubjectText ? `?subject=${encodeURIComponent(emailSubjectText)}` : ''
  const contactLink = `<a href="mailto:${emailAddress}${subjectPart}">${linkText}</a>`
  return `${prefixText}${contactLink}${suffixText}`
}

export const maxOf = <A, B>(all: A[], map: (a: A) => B): B => {
  let max: B = null
  all.forEach(it => {
    if (!max) {
      max = map(it)
    }
    if (map(it) && map(it) > max) {
      max = map(it)
    }
  })
  return max
}

export const sortDisplayableDates = (dates: { type: string }[]): { type: string }[] => {
  return dates.sort((a, b) => filteredListOfDates.indexOf(a.type) - filteredListOfDates.indexOf(b.type))
}

export const dateToDayMonthYear = (date: string): { day: number; month: number; year: number } => {
  const parsedDate = dayjs(date)
  const day = parsedDate.date()
  const month = parsedDate.month() + 1 // months are 0 indexed in JS
  const year = parsedDate.year()
  return { day, month, year }
}

export const convertValidationToErrorMessages = (validationMessages: ValidationMessage[]): ErrorMessages => {
  if (validationMessages.length === 0) {
    return { messages: [] }
  }
  return {
    messageType: ErrorMessageType[validationMessages[0].type],
    messages: validationMessages.map(m => {
      return { text: m.message } as ErrorMessage
    }),
  }
}

import dayjs from 'dayjs'
import { DesignSystemEnvironment } from '@ministryofjustice/hmpps-court-cases-release-dates-design/hmpps/@types'
import { AdjustmentDuration } from '../@types/calculateReleaseDates/rulesWithExtraAdjustments'
import config from '../config'

const properCase = (word: string): string =>
  word.length >= 1 ? word[0].toUpperCase() + word.toLowerCase().slice(1) : word

const isBlank = (str: string): boolean => !str || /^\s*$/.test(str)

/**
 * Converts a name (first name, last name, middle name, etc.) to proper case equivalent, handling double-barreled names
 * correctly (i.e. each part in a double-barreled is converted to proper case).
 * @param name name to be converted.
 * @returns name converted to proper case.
 */
const properCaseName = (name: string): string => (isBlank(name) ? '' : name.split('-').map(properCase).join('-'))

export const convertToTitleCase = (sentence: string): string =>
  isBlank(sentence) ? '' : sentence.split(' ').map(properCaseName).join(' ')

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

export default convertToTitleCase

export const unique = <T>(value: T, index: number, self: T[]) => {
  return self.indexOf(value) === index
}

export const arraysContainSameItemsAsStrings = <T>(array1: T[], array2: T[]) => {
  return (
    array1
      .map(it => JSON.stringify(it))
      .sort()
      .join(',') ===
    array2
      .map(it => JSON.stringify(it))
      .sort()
      .join(',')
  )
}

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

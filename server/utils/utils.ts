import dayjs from 'dayjs'
import { AdjustmentDuration } from '../@types/calculateReleaseDates/rulesWithExtraAdjustments'

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

const convertToTitleCase = (sentence: string): string =>
  isBlank(sentence) ? '' : sentence.split(' ').map(properCaseName).join(' ')

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

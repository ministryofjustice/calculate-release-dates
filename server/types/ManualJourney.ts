import { ManualEntrySelectedDate } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

export type ManualJourneySelectedDate = {
  position: number
  dateType: string
  manualEntrySelectedDate?: ManualEntrySelectedDate
  completed: boolean
}

import {
  ManualEntrySelectedDateType,
  SubmittedDate,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

export type ManualJourneySelectedDate = {
  position: number
  dateType: string
  manualEntrySelectedDate?: ManualEntrySelectedDate
  completed: boolean
}

export type ManualEntrySelectedDate = {
  dateType: ManualEntrySelectedDateType
  dateText: string
  date?: SubmittedDate
}

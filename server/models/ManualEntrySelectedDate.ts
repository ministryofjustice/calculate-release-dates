export interface ManualEntrySelectedDate {
  dateType: string
  dateText: string
  date?: SubmittedDate
}

export interface SubmittedDate {
  day: string
  month: string
  year: string
}

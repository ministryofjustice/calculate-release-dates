export interface GenuineOverrideInputs {
  state: 'NEW' | 'INITIALISED_DATES'
  datesToSave?: EnteredGenuineOverrideDate[]
  datesBeingAdded?: NewGenuineOverrideDate[]
  reason?: string
  reasonFurtherDetail?: string
}

export interface EnteredGenuineOverrideDate {
  type: string
  date: string
}

export interface NewGenuineOverrideDate {
  type: string
  day?: number
  month?: number
  year?: number
}

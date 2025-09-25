export interface GenuineOverrideInputs {
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
  date?: string
}

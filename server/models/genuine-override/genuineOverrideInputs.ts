export interface GenuineOverrideInputs {
  mode: 'STANDARD' | 'EXPRESS'
  datesToSave: EnteredGenuineOverrideDate[]
  datesBeingAdded?: NewGenuineOverrideDate[]
  reason?: string
  reasonFurtherDetail?: string
  previousOverride?: {
    calculationRequestId: number
    reason: string
    reasonFurtherDetail?: string
    dates: EnteredGenuineOverrideDate[]
  }
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

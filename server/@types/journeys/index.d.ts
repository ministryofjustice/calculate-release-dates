export interface ApprovedDatesJourney {
  id: string
  lastTouched: string
  nomsId: string
  preliminaryCalculationRequestId: number
  datesToSave: EnteredDate[]
  datesBeingAdded: NewDate[]
}

export interface GenuineOverrideInputs {
  mode: 'STANDARD' | 'EXPRESS'
  datesToSave: EnteredDate[]
  datesBeingAdded?: NewDate[]
  reason?: string
  reasonFurtherDetail?: string
  previousOverride?: {
    calculationRequestId: number
    reason: string
    reasonFurtherDetail?: string
    dates: EnteredDate[]
  }
}

type PersonJourneyParams = { nomsId: string; journeyId: string }

export interface EnteredDate {
  type: string
  date: string
}

export interface NewDate {
  type: string
  day?: number
  month?: number
  year?: number
}

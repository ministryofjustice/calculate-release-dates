export interface ApprovedDatesJourney {
  id: string
  lastTouched: string
  nomsId: string
  preliminaryCalculationRequestId: number
}

type PersonJourneyParams = { nomsId: string; journeyId: string }

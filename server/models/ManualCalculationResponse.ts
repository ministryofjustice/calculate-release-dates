import ReleaseDateType from '../enumerations/releaseDateType'

export default interface ManualCalculationResponse {
  calculationRequestId: number
  enteredDates: Map<ReleaseDateType, string>
}

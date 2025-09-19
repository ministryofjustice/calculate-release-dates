export default class GenuineOverrideUrls {
  static selectReasonForOverride = (prisonerNumber: string, calculationRequestId: string | number) => {
    return `/calculation/${prisonerNumber}/select-reason-for-override/${calculationRequestId}`
  }

  static selectDatesToOverride = (prisonerNumber: string, calculationRequestId: string | number) => {
    return `/calculation/${prisonerNumber}/select-dates-to-override/${calculationRequestId}`
  }
}

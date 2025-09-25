export default class GenuineOverrideUrls {
  static selectReasonForOverride = (prisonerNumber: string, calculationRequestId: string | number) => {
    return `/calculation/${prisonerNumber}/select-reason-for-override/${calculationRequestId}`
  }

  static reviewDatesForOverride = (prisonerNumber: string, calculationRequestId: string | number) => {
    return `/calculation/${prisonerNumber}/review-dates-for-override/${calculationRequestId}`
  }

  static overrideDate = (prisonerNumber: string, calculationRequestId: string | number, type: string) => {
    return `/calculation/${prisonerNumber}/override/${type}/edit/${calculationRequestId}`
  }

  static deleteDate = (prisonerNumber: string, calculationRequestId: string | number, type: string) => {
    return `/calculation/${prisonerNumber}/override/${type}/delete/${calculationRequestId}`
  }

  static enterNewDate = (prisonerNumber: string, calculationRequestId: string | number, type: string) => {
    return `/calculation/${prisonerNumber}/override/${type}/add/${calculationRequestId}`
  }

  static selectDatesToAdd = (prisonerNumber: string, calculationRequestId: string | number) => {
    return `/calculation/${prisonerNumber}/override/select-dates/${calculationRequestId}`
  }
}

export default class GenuineOverrideUrls {
  static startGenuineOverride = (prisonerNumber: string, calculationRequestId: string | number) => {
    return `/calculation/${prisonerNumber}/start-genuine-override/${calculationRequestId}`
  }

  static selectReasonForOverride = (prisonerNumber: string, calculationRequestId: string | number) => {
    return `/calculation/${prisonerNumber}/select-reason-for-override/${calculationRequestId}`
  }

  static interceptForExpressOverride = (prisonerNumber: string, calculationRequestId: string | number) => {
    return `/calculation/${prisonerNumber}/express-override-intercept/${calculationRequestId}`
  }

  static reviewDatesForOverride = (prisonerNumber: string, calculationRequestId: string | number) => {
    return `/calculation/${prisonerNumber}/review-dates-for-override/${calculationRequestId}`
  }

  static interceptForWeekendHolidayGenuineOverride = (
    prisonerNumber: string,
    calculationRequestId: string | number,
  ) => {
    return `/calculation/${prisonerNumber}/weekend-holiday-override-intercept/${calculationRequestId}`
  }

  static reviewDateFromPreviousOverride = (prisonerNumber: string, calculationRequestId: string | number) => {
    return `/calculation/${prisonerNumber}/review-dates-from-previous-override/${calculationRequestId}`
  }

  static editDate = (prisonerNumber: string, calculationRequestId: string | number, type: string) => {
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

  static continueForHolidayInterceptOverride = (prisonerNumber: string, calculationRequestId: string | number) => {
    return `/calculation/${prisonerNumber}/summary/${calculationRequestId}`
  }

  static enterApprovedDatesForOverride(nomsId: string, calculationRequestId: string) {
    return `/calculation/${nomsId}/${calculationRequestId}/select-approved-dates`
  }
}

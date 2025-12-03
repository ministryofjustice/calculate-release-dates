export default class ApprovedDatesUrls {
  static startApprovedDates = (prisonerNumber: string) => {
    return `/approved-dates/${prisonerNumber}/start`
  }

  static reviewCalculatedDates = (prisonerNumber: string, journeyId: string) => {
    return `/approved-dates/${prisonerNumber}/review-calculated-dates/${journeyId}`
  }
}

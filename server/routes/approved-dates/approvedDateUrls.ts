export default class ApprovedDatesUrls {
  static startApprovedDates = (prisonerNumber: string) => {
    return `/approved-dates/${prisonerNumber}/start`
  }

  static reviewCalculatedDates = (prisonerNumber: string, journeyId: string) => {
    return `/approved-dates/${prisonerNumber}/review-calculated-dates/${journeyId}`
  }

  static reviewApprovedDates(prisonerNumber: string, journeyId: string) {
    return `/approved-dates/${prisonerNumber}/review-approved-dates/${journeyId}`
  }

  static selectDatesToAdd(prisonerNumber: string, journeyId: string) {
    return `/approved-dates/${prisonerNumber}/select-dates/${journeyId}`
  }

  static editDate = (prisonerNumber: string, journeyId: string, type: string) => {
    return `/approved-dates/${prisonerNumber}/${type}/edit/${journeyId}`
  }

  static deleteDate = (prisonerNumber: string, journeyId: string, type: string) => {
    return `/approved-dates/${prisonerNumber}/${type}/delete/${journeyId}`
  }

  static enterNewDate = (prisonerNumber: string, journeyId: string, type: string) => {
    return `/approved-dates/${prisonerNumber}/${type}/add/${journeyId}`
  }
}

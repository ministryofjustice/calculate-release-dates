import { ComparisonMismatchSummary } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

export default class Hdced4PlusResultDate {
  key: { html: string }

  value: { text: string }

  constructor(comparisonMismatchSummary: ComparisonMismatchSummary) {
    this.key = { html: this.getOffenderDetails(comparisonMismatchSummary) }
    const message = comparisonMismatchSummary.hdcedFourPlusDate
    this.value = {
      text: message,
    }
  }

  private getOffenderDetails(comparisonMismatchSummary: ComparisonMismatchSummary) {
    let offenderDetails = `<span class="comparison-person">${comparisonMismatchSummary.personId}</span>`
    if (comparisonMismatchSummary.lastName) {
      offenderDetails += `<span>${comparisonMismatchSummary.lastName}</span>`
    }
    return offenderDetails
  }
}

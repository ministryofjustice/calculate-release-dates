import { HdcFourPlusComparisonMismatch } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

export default class Hdced4PlusResultDate {
  key: { html: string }

  value: { text: string }

  constructor(comparisonMismatchSummary: HdcFourPlusComparisonMismatch, prison: string) {
    this.key = { html: this.getOffenderDetails(comparisonMismatchSummary, prison) }
    const message = comparisonMismatchSummary.hdcedFourPlusDate
    this.value = {
      text: message,
    }
  }

  private getOffenderDetails(comparisonMismatchSummary: HdcFourPlusComparisonMismatch, prison: string) {
    let offenderDetails = `<span class="comparison-person">${comparisonMismatchSummary.personId}</span>`
    if (comparisonMismatchSummary.lastName) {
      offenderDetails += `<span class="comparison-person">${comparisonMismatchSummary.lastName}</span>`
    }
    if (prison === 'all') {
      offenderDetails += `<span>${comparisonMismatchSummary.establishment}</span>`
    }
    return offenderDetails
  }
}

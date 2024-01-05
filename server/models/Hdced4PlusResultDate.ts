import { ComparisonMismatchSummary } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

export default class Hdced4PlusResultDate {
  key: { text: string }

  value: { text: string }

  constructor(comparisonMismatchSummary: ComparisonMismatchSummary) {
    this.key = { text: comparisonMismatchSummary.personId }
    const message = comparisonMismatchSummary.hdcedFourPlusDate
    this.value = {
      text: message,
    }
  }
}

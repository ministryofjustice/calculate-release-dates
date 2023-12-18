import { ComparisonMismatchSummary } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ComparisonType from '../enumerations/comparisonType'

interface ActionItem {
  href: string
  text: string
  visuallyHiddenText: string
}

export default class ComparisonResultMismatch {
  key: { text: string }

  value: { text: string }

  actions: { items: ActionItem[] }

  constructor(
    comparisonMismatchSummary: ComparisonMismatchSummary,
    comparisonId: string,
    comparisonType: ComparisonType
  ) {
    this.key = { text: comparisonMismatchSummary.personId }
    let message = comparisonMismatchSummary.validationMessages
      .map(validationMessage => validationMessage.message)
      .join(', ')
    if (!message && !comparisonMismatchSummary.isMatch) {
      message = 'Release dates mismatch'
    }
    this.value = {
      text: message,
    }
    let href
    if (comparisonType === ComparisonType.MANUAL) {
      href = `/compare/manual/result/${comparisonId}/detail/${comparisonMismatchSummary.shortReference}`
    } else if (comparisonType !== ComparisonType.ESTABLISHMENT_HDCED4PLUS) {
      href = `/compare/result/${comparisonId}/detail/${comparisonMismatchSummary.shortReference}`
    }
    if (href) {
      this.actions = {
        items: [
          {
            href,
            text: 'View details',
            visuallyHiddenText: 'name',
          },
        ],
      }
    }
  }
}
